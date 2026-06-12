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
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { getStatoVariant, LnkStatoVariant } from './stato-variants.const';

/**
 * Pill colorata per lo stato di un'entita` (adesione, servizio, ecc.)
 * usata nelle pagine vetrina. La variant e` derivata da una tabella
 * esplicita stato → variant (vedi `stato-variants.const.ts`), non
 * piu` keyword-based.
 *
 * Il `[stato]` puo` essere passato come chiave grezza
 * (es. `pubblicato_collaudo`) oppure come stringa gia` localizzata.
 * Se `[i18nPrefix]` e` valorizzato la chiave grezza viene tradotta
 * via `TranslateService` con `<prefix>.<stato>`.
 */
@Component({
  selector: 'lnk-stato-chip',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="lnk-stato-chip"
          [ngClass]="['is-' + variant(), size === 'sm' ? 'is-sm' : '']">
      @if (i18nPrefix) {
        {{ (i18nPrefix + '.' + _stato()) | translate }}
      } @else {
        {{ _stato() }}
      }
    </span>
  `,
  styles: [`
    :host { display: inline-flex; }

    .lnk-stato-chip {
      display: inline-flex; align-items: center;
      padding: 3px 10px; border-radius: 999px;
      font-size: 12px; font-weight: 600;
      border: 1px solid;
      white-space: nowrap;
      word-break: keep-all;
      overflow-wrap: normal;
      flex-shrink: 0;
      /* A11Y P4: base era --ink-3 su --surface-3 (4.42:1, fail
         AA). Spostato a --ink-2 (#2e445a, 7.92:1) per chip
         "stato sconosciuto" - testo informativo, AA garantita. */
      background: var(--surface-3); color: var(--ink-2); border-color: var(--line);
    }

    /* A11Y P4: is-draft / is-archived stesso problema del base.
       is-archived inoltre aveva opacity .8 che degradava ulteriormente
       il contrasto (~3.5:1) → opacity rimossa, scuriti i colori. */
    .lnk-stato-chip.is-draft       { background: var(--surface-3); color: var(--ink-2);    border-color: var(--line); }
    .lnk-stato-chip.is-pending     { background: var(--warn-soft); color: var(--warn-ink); border-color: var(--warn-border); }
    .lnk-stato-chip.is-in-progress { background: var(--info-soft); color: var(--info-ink); border-color: var(--info-border); }
    .lnk-stato-chip.is-test        { background: var(--info-soft); color: var(--info-ink); border-color: var(--info-border); }
    .lnk-stato-chip.is-prod        { background: var(--ok-soft);   color: var(--ok-ink);   border-color: var(--ok-border); }
    .lnk-stato-chip.is-archived    { background: var(--surface-3); color: var(--ink-2);    border-color: var(--line); }
    .lnk-stato-chip.is-error       { background: var(--accent-soft); color: var(--accent-ink); border-color: var(--accent-border); }
    /* Size compatto (es. dashboard, liste fitte): padding/font ridotti. */
    .lnk-stato-chip.is-sm { padding: 1px 8px; font-size: 11px; font-weight: 600; line-height: 1.3; }
  `],
})
export class StatoChipComponent {
  private readonly _statoSig = signal<string>('');
  @Input() set stato(v: string | null | undefined) { this._statoSig.set(v ?? ''); }
  get stato(): string { return this._statoSig(); }

  /** Prefisso i18n opzionale (es. `APP.ADESIONI.STATO`). */
  @Input() i18nPrefix: string | null = null;

  /** Size compatto (`'sm'`) per liste fitte / dashboard. Default `''`. */
  @Input() size: '' | 'sm' = '';

  /** Esposto per il template — non override-abile. */
  _stato = this._statoSig;

  variant = computed<LnkStatoVariant>(() => getStatoVariant(this._statoSig()));
}
