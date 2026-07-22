/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/*
 * Audit di accessibilità RIPETIBILE (WCAG 2.2 AA).
 *
 * Requisiti: dev server attivo (`npm run start-apicat`) con autenticazione
 * dev via header `X-GovCat-principal` abilitata sul backend/proxy.
 *
 * Uso:   npm run a11y:report
 * Env:   A11Y_BASE_URL   (default http://localhost:6200)
 *        A11Y_PRINCIPAL  (default lorenzo.gestore)
 *        A11Y_ORG        (default "Ministero Interno")
 *        A11Y_PORT       (porta CDP per Lighthouse, default 9222)
 *
 * Per ogni rotta calcola: punteggio Lighthouse accessibility (0-100) e le
 * violazioni axe-core con tag WCAG. Genera report MD + JSON in `a11y-report/`.
 *
 * NB: il punteggio automatico copre ~30-40% dei criteri WCAG; NON sostituisce
 * un audit manuale (tastiera, screen reader, zoom) né una dichiarazione formale.
 */
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import lighthouse from 'lighthouse';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.A11Y_BASE_URL || 'http://localhost:6200';
const PRINCIPAL = process.env.A11Y_PRINCIPAL || 'lorenzo.gestore';
const ORG = process.env.A11Y_ORG || 'Ministero Interno';
const PORT = Number(process.env.A11Y_PORT || 9222);
const HEADERS = { 'X-GovCat-principal': PRINCIPAL };
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '..', 'a11y-report');

// Rotte a URL stabile. I dettagli (servizio/client) sono scoperti a runtime.
const STATIC_ROUTES = [
  { name: 'Lista servizi', url: '/servizi' },
  { name: 'Nuovo servizio (form)', url: '/servizi/new' },
  { name: 'Lista adesioni', url: '/adesioni' },
  { name: 'Wizard adesione (form)', url: '/adesioni/new/edit' },
  { name: 'Lista client', url: '/client' },
  { name: 'Lista domini', url: '/domini' },
  { name: 'Lista soggetti', url: '/soggetti' },
  { name: 'Lista organizzazioni', url: '/organizzazioni' },
  { name: 'Lista utenti', url: '/utenti' },
  { name: 'Lista gruppi', url: '/gruppi' },
  { name: 'Lista classi utente', url: '/classi-utente' },
  { name: 'Dashboard', url: '/dashboard' },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function selectOrganization(page) {
  await page.goto(`${BASE}/servizi`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await sleep(1500);
  if (page.url().includes('select-organization')) {
    const org = page.getByRole('button', { name: new RegExp(ORG, 'i') });
    if (await org.count()) {
      await org.first().click();
      await page.getByRole('button', { name: /^Conferma$/i }).click();
      await page.waitForURL('**/servizi**', { timeout: 15000 }).catch(() => {});
      await sleep(1000);
    }
  }
}

async function discoverDetailRoutes(page) {
  const routes = [];
  // primo servizio dalla lista
  try {
    await page.goto(`${BASE}/servizi`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    const href = await page.evaluate(() => {
      const el = document.querySelector('a[href*="/servizi/"][href*="/view"]');
      if (el) return el.getAttribute('href');
      // la card è un div cliccabile: proviamo a leggere un id dal primo item
      return null;
    });
    if (href) routes.push({ name: 'Dettaglio servizio', url: href.replace(/^https?:\/\/[^/]+/, '') });
  } catch { /* skip */ }
  // primo client dalla lista
  try {
    await page.goto(`${BASE}/client`, { waitUntil: 'domcontentloaded' });
    await sleep(2000);
    const href = await page.evaluate(() => {
      const el = document.querySelector('a[href*="/client/"]');
      return el ? el.getAttribute('href') : null;
    });
    if (href) routes.push({ name: 'Dettaglio client', url: href.replace(/^https?:\/\/[^/]+/, '') });
  } catch { /* skip */ }
  return routes;
}

async function auditRoute(page, route) {
  const url = route.url.startsWith('http') ? route.url : `${BASE}${route.url}`;
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await sleep(1200);

  // axe-core (violazioni WCAG)
  let axeViolations = [];
  try {
    const axe = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
    axeViolations = axe.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
    }));
  } catch (e) {
    axeViolations = [{ id: 'axe-error', impact: 'n/a', help: String(e).slice(0, 120), nodes: 0 }];
  }

  // Lighthouse (punteggio 0-100)
  let score = null;
  let lhFailed = [];
  try {
    const runner = await lighthouse(url, {
      port: PORT,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['accessibility'],
      disableStorageReset: true,
      extraHeaders: HEADERS,
      formFactor: 'desktop',
      screenEmulation: { disabled: true },
      throttlingMethod: 'provided',
    });
    const lhr = runner.lhr;
    score = Math.round((lhr.categories.accessibility.score || 0) * 100);
    for (const ref of lhr.categories.accessibility.auditRefs) {
      const a = lhr.audits[ref.id];
      if (a && a.score !== null && a.score < 1) lhFailed.push(ref.id);
    }
  } catch (e) {
    lhFailed = [`lighthouse-error: ${String(e).slice(0, 120)}`];
  }

  return { ...route, url, score, lhFailed, axeViolations };
}

function buildMarkdown(results, meta) {
  const scored = results.filter((r) => typeof r.score === 'number');
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.score, 0) / scored.length) : 0;
  const totalAxe = results.reduce((s, r) => s + r.axeViolations.reduce((n, v) => n + v.nodes, 0), 0);

  let md = `# Stato accessibilità — GovCat (apicat-app)\n\n`;
  md += `**Standard**: WCAG 2.2 AA · **Data**: ${meta.date} · **Ambiente**: ${meta.base}\n`;
  md += `**Metodo**: Lighthouse (punteggio automatico) + axe-core (violazioni WCAG), autenticato come \`${meta.principal}\` (org: ${meta.org}).\n\n`;
  md += `> Il punteggio automatico copre ~30-40% dei criteri WCAG. NON è una dichiarazione di conformità formale (AgID/EN 301 549), che richiede audit manuale (tastiera, screen reader, zoom) e dichiarazione firmata.\n\n`;
  md += `## Sintesi\n\n`;
  md += `- **Punteggio medio Lighthouse**: **${avg}/100** su ${scored.length} rotte\n`;
  md += `- **Violazioni axe-core totali** (nodi): **${totalAxe}**\n`;
  md += `- **Rotte verificate**: ${results.length}\n\n`;
  md += `## Dettaglio per rotta\n\n`;
  md += `| Rotta | URL | Lighthouse | Violazioni axe (nodi) | Regole axe fallite |\n`;
  md += `|---|---|:--:|:--:|---|\n`;
  for (const r of results) {
    const axeRules = r.axeViolations.length ? r.axeViolations.map((v) => `${v.id}(${v.nodes})`).join(', ') : '—';
    const axeNodes = r.axeViolations.reduce((n, v) => n + v.nodes, 0);
    md += `| ${r.name} | \`${r.url.replace(meta.base, '')}\` | ${r.score ?? 'n/a'} | ${axeNodes} | ${axeRules} |\n`;
  }
  md += `\n## Violazioni axe per rotta (dettaglio)\n\n`;
  for (const r of results) {
    if (!r.axeViolations.length) continue;
    md += `### ${r.name}\n`;
    for (const v of r.axeViolations) {
      md += `- **${v.id}** (${v.impact}, ${v.nodes} nodi): ${v.help}\n`;
    }
    md += `\n`;
  }
  md += `---\n_Report generato da \`scripts/a11y-audit.mjs\`. Rieseguibile con \`npm run a11y:report\`._\n`;
  return { md, avg, totalAxe };
}

async function main() {
  console.log(`[a11y] Ambiente: ${BASE} — principal: ${PRINCIPAL} — org: ${ORG}`);
  const browser = await chromium.launch({
    headless: true,
    args: [`--remote-debugging-port=${PORT}`],
  });
  const context = await browser.newContext({ extraHTTPHeaders: HEADERS, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  try {
    await selectOrganization(page);
    const detailRoutes = await discoverDetailRoutes(page);
    const routes = [...STATIC_ROUTES, ...detailRoutes];

    const results = [];
    for (const route of routes) {
      process.stdout.write(`[a11y] Audit ${route.name} (${route.url}) ... `);
      const res = await auditRoute(page, route);
      console.log(`LH=${res.score ?? 'n/a'}  axe-violations=${res.axeViolations.length}`);
      results.push(res);
    }

    const date = new Date().toISOString();
    const meta = { date, base: BASE, principal: PRINCIPAL, org: ORG };
    const { md, avg, totalAxe } = buildMarkdown(results, meta);

    mkdirSync(OUT_DIR, { recursive: true });
    const stamp = date.replace(/[:.]/g, '-');
    writeFileSync(join(OUT_DIR, `report-${stamp}.md`), md);
    writeFileSync(join(OUT_DIR, `report-${stamp}.json`), JSON.stringify({ meta, avg, totalAxe, results }, null, 2));
    writeFileSync(join(OUT_DIR, `latest.md`), md);
    writeFileSync(join(OUT_DIR, `latest.json`), JSON.stringify({ meta, avg, totalAxe, results }, null, 2));

    console.log(`\n[a11y] FATTO. Media Lighthouse: ${avg}/100 — violazioni axe (nodi): ${totalAxe}`);
    console.log(`[a11y] Report: ${join(OUT_DIR, 'latest.md')}`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('[a11y] Errore:', e);
  process.exit(1);
});
