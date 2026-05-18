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
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Avatar locale "initials" che sostituisce `ngx-gravatar`.
 * Renderizza le iniziali del nome (o dell'email) su sfondo a tinta
 * scelta in modo deterministico via hash dell'identificativo.
 *
 * Non carica risorse esterne (compatibile con CSP `default-src 'self'`).
 *
 * Esempio:
 *   <lnk-avatar [email]="profile.email_aziendale"
 *               [name]="profile.nome + ' ' + profile.cognome"
 *               [size]="96"></lnk-avatar>
 */
@Component({
  selector: 'lnk-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule]
})
export class LnkAvatarComponent {
  /** Email — usata come seed primario per il colore (stabile). */
  readonly email = input<string | null | undefined>('');
  /** Nome completo, opzionale — usato per le iniziali se presente. */
  readonly name = input<string | null | undefined>('');
  /** Dimensione lato (px). Default 40. */
  readonly size = input<number>(40);
  /** Forma rotonda (default true). False = quadrata con bordi arrotondati. */
  readonly round = input<boolean>(true);
  /** Testo alt per accessibilita`. Se assente -> derivato da name/email. */
  readonly alt = input<string>('');

  /** Iniziali da mostrare. */
  protected readonly _initials = computed<string>(() => {
    const n = (this.name() ?? '').trim();
    if (n) {
      const parts = n.split(/\s+/).filter(Boolean);
      const a = (parts[0]?.[0] ?? '').toUpperCase();
      const b = (parts.length > 1 ? parts[parts.length - 1][0] : '').toUpperCase();
      return (a + b) || a || '?';
    }
    const e = (this.email() ?? '').trim();
    if (e) {
      const local = e.split('@')[0] ?? '';
      const segs = local.split(/[._\-+]/).filter(Boolean);
      const a = (segs[0]?.[0] ?? '').toUpperCase();
      const b = (segs.length > 1 ? segs[1][0] : '').toUpperCase();
      return (a + b) || a.toUpperCase() || '?';
    }
    return '?';
  });

  /** Indice palette deterministico dal seed (email > name > stringa vuota). */
  protected readonly _paletteIdx = computed<number>(() => {
    const seed = (this.email() ?? this.name() ?? '').toLowerCase();
    if (!seed) return 0;
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = ((h << 5) - h) + seed.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h) % PALETTE.length;
  });

  protected readonly _palette = computed<Palette>(() => PALETTE[this._paletteIdx()]);

  protected readonly _ariaLabel = computed<string>(() => {
    const a = this.alt();
    if (a) return a;
    const n = (this.name() ?? '').trim();
    if (n) return n;
    const e = (this.email() ?? '').trim();
    return e || 'Avatar';
  });

  /** Font size proporzionale al diametro (~40% del lato). */
  protected readonly _fontSize = computed<number>(() => Math.round(this.size() * 0.4));
}

interface Palette {
  bg: string;
  fg: string;
}

/**
 * Palette accessibile (WCAG AA testo normale ≥ 4.5:1). Tinte derivate
 * dal design system Link.it (`--*-soft` come bg, `--*-ink` come fg) +
 * variazioni neutrali per coprire un range piu` ampio di hash.
 */
const PALETTE: Palette[] = [
  // ok (verde)
  { bg: '#e3f3ec', fg: '#14633f' },
  // info (blu)
  { bg: '#e3edfb', fg: '#1a4aa8' },
  // warn (arancio)
  { bg: '#fbf1e2', fg: '#8a5310' },
  // accent (rosso brand) — palette piu` chiara per AA
  { bg: '#ffe9eb', fg: '#b81e2b' },
  // brand (blu scuro)
  { bg: '#cce3ed', fg: '#21324a' },
  // viola
  { bg: '#ede7f6', fg: '#4527a0' },
  // teal
  { bg: '#d9efef', fg: '#0e6e6e' },
  // muted
  { bg: '#eef4f8', fg: '#2e445a' },
];
