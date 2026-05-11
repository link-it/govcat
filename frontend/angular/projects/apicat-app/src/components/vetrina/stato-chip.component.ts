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

/**
 * Pill colorata per lo stato di un'entita` (adesione, servizio, ecc.)
 * usata nelle pagine vetrina. Esegue una semantica di mapping:
 *  - stati che contengono "produzione" -> ok (verde)
 *  - "archiviato"                        -> muted (grigio)
 *  - "collaudo"                          -> info (blu)
 *  - default                             -> info
 *
 * Il `[stato]` puo` essere passato come chiave grezza
 * (es. `pubblicato_collaudo`) oppure come stringa gia` localizzata.
 * Se `[i18nPrefix]` e` valorizzato la chiave grezza viene tradotta
 * via `TranslateService` con `<prefix>.<stato>`.
 *
 * Estratto e generalizzato da
 * `mock-views/app/shared/stato-chip.component.ts`.
 */
@Component({
  selector: 'lnk-stato-chip',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="chip"
          [class.chip-ok]="variant() === 'ok'"
          [class.chip-info]="variant() === 'info'"
          [class.chip-muted]="variant() === 'muted'"
          [class.chip-warn]="variant() === 'warn'">
      <span class="pulse"></span>
      @if (i18nPrefix) {
        {{ (i18nPrefix + '.' + _stato()) | translate }}
      } @else {
        {{ _stato() }}
      }
    </span>
  `,
})
export class StatoChipComponent {
  private readonly _statoSig = signal<string>('');
  @Input() set stato(v: string | null | undefined) { this._statoSig.set(v ?? ''); }
  get stato(): string { return this._statoSig(); }

  /** Prefisso i18n opzionale (es. `APP.ADESIONI.STATO`). */
  @Input() i18nPrefix: string | null = null;

  /** Esposto per il template — non override-abile. */
  _stato = this._statoSig;

  variant = computed<'ok' | 'info' | 'muted' | 'warn'>(() => {
    const s = (this._statoSig() || '').toLowerCase();
    if (s.includes('archiviato') || s.includes('rifiutato') || s.includes('rimosso')) {
      return 'muted';
    }
    if (s.includes('produzione')) {
      return 'ok';
    }
    if (s.includes('attesa') || s.includes('richiest') || s.includes('approva')) {
      return 'warn';
    }
    return 'info';
  });
}
