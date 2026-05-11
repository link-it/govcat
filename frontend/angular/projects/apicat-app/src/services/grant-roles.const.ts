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

/**
 * Grant roles utilizzati dai controlli di permesso lato FE.
 *
 * NOTA: i ruoli "ufficiali" del BE sono in `model/ruoloUtenteEnum.ts`
 * (`RuoloUtenteEnum`) e `model/ruoloOrganizzazioneEnum.ts`
 * (`RuoloOrganizzazioneEnum`) — quelli sono auto-generati da OpenAPI
 * e non vanno toccati. Questa const raccoglie invece i nomi dei
 * "grant" che il backend consegna nell'array `grant` dei vari endpoint
 * (referente, referente_tecnico, ecc.) e i ruoli FE-side che vengono
 * mappati nei controlli `canEdit/canManagement/_isDatoSempreModificabile`.
 *
 * Punto unico di modifica: quando un ruolo viene rinominato o rimosso
 * lato BE, basta aggiornare il valore (o eliminare l'entry) qui.
 */
export const GrantRole = {
  // ── User-level (stesse stringhe di RuoloUtenteEnum, ma esposte qui
  //    per uniformita' nei check sull'array `grant`) ──────────────────
  Gestore: 'gestore',
  Coordinatore: 'coordinatore',
  Richiedente: 'richiedente',
  /** @deprecated In favore di `UtenteOrganizzazione`. */
  ReferenteServizio: 'referente_servizio',
  UtenteOrganizzazione: 'utente_organizzazione',

  // ── Referente "generici" (granted dal BE in base alle liste dei
  //    referenti dell'entita' richiesta) ─────────────────────────────
  Referente: 'referente',
  ReferenteTecnico: 'referente_tecnico',
  ReferenteSuperiore: 'referente_superiore',
  ReferenteTecnicoSuperiore: 'referente_tecnico_superiore',

  // ── Referente "per-contesto" (usati solo da
  //    `_isDatoSempreModificabile` per il match con la configurazione
  //    `dati_sempre_modificabili`) ───────────────────────────────────
  ReferenteAdesione: 'referente_adesione',
  ReferenteDominio: 'referente_dominio',
  ReferenteTecnicoAdesione: 'referente_tecnico_adesione',
  ReferenteTecnicoServizio: 'referente_tecnico_servizio',
  ReferenteTecnicoDominio: 'referente_tecnico_dominio',
} as const;

export type GrantRole = typeof GrantRole[keyof typeof GrantRole];

/**
 * Mapping di base "tecnico → non-tecnico": il grant `referente_tecnico`
 * implica anche `referente`, idem per la variante `_superiore`. Usato
 * dai controlli `canEdit / canEditField / canMonitoraggio`.
 *
 * Restituisce una NUOVA array (non muta l'input).
 */
export function expandTecnicoGrants(grant: string[]): string[] {
  const out = [...grant];
  if (out.includes(GrantRole.ReferenteTecnico)) {
    out.push(GrantRole.Referente);
  }
  if (out.includes(GrantRole.ReferenteTecnicoSuperiore)) {
    out.push(GrantRole.ReferenteSuperiore);
  }
  return out;
}

/**
 * Mapping esteso: come `expandTecnicoGrants` + i grant "per-contesto"
 * (`referente_adesione`, `referente_servizio`, `referente_dominio`,
 * `utente_organizzazione`, `referente_tecnico_*`) vengono mappati su
 * `referente`. Usato esclusivamente da `_isDatoSempreModificabile`
 * per matchare i ruoli configurati in `dati_sempre_modificabili`.
 *
 * `referente_servizio` e' deprecato in favore di `utente_organizzazione`
 * ma viene mantenuto per retrocompatibilita' coi dati legacy.
 */
export function expandContextualGrants(grant: string[]): string[] {
  const out = expandTecnicoGrants(grant);
  if (out.includes(GrantRole.ReferenteAdesione) ||
      out.includes(GrantRole.ReferenteServizio) ||
      out.includes(GrantRole.UtenteOrganizzazione) ||
      out.includes(GrantRole.ReferenteDominio)) {
    out.push(GrantRole.Referente);
  }
  if (out.includes(GrantRole.ReferenteTecnicoAdesione) ||
      out.includes(GrantRole.ReferenteTecnicoServizio) ||
      out.includes(GrantRole.ReferenteTecnicoDominio)) {
    out.push(GrantRole.Referente);
  }
  return out;
}
