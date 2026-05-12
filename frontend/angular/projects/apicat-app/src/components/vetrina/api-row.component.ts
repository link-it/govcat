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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopoverModule } from 'ngx-bootstrap/popover';

/**
 * Tag visualizzato accanto al nome dell'API. Il `variant` mappa una
 * delle palette del design system Link.it (vedi `app-view.scss`):
 *  - `pdnd`   — tag azzurro (info-soft / info-ink). Usato per
 *    evidenziare le API PDND.
 *  - `profilo`— tag giallo (warn-soft / warn-ink). Usato per il
 *    profilo di autenticazione (es. "BASIC_FRUIZIONI").
 *  - `custom` — tag neutro (surface-3 / ink-2). Usato per le
 *    proprieta` custom marcate `vetrina: true`.
 */
export interface LnkApiTag {
  /** Testo del tag (parte sinistra in modalita` split). Gia`
   *  localizzato (i18n risolto a monte). */
  label: string;
  /**
   * Se valorizzato, il tag e` renderizzato come pill composito
   * "label | value" (split-pill, vedi mock `[PDND | v.1]`): la
   * parte sinistra mantiene la palette `variant`, la parte
   * destra ha sfondo `surface` con un divisore verticale.
   */
  value?: string;
  /** Variante stilistica. Default `custom`. */
  variant?: 'pdnd' | 'profilo' | 'custom';
}

/**
 * Riga di una API nella lista vetrina. Layout grid 4-col:
 * `[avatar | body | tags | chevron]`.
 *
 * Overflow tags: se `tags.length > maxTags` (default 3, disabilita con
 * `null`), i tag extra vengono raccolti in un bottone `+n` con
 * popover. Il tag con `variant: 'profilo'` resta SEMPRE visibile —
 * gli altri scorrono nel popover in ordine.
 *
 * Esempio uso:
 * ```html
 * <lnk-api-row
 *   [nome]="api.nome"
 *   [versione]="api.versione"
 *   [descrizione]="api.descrizione"
 *   [tags]="[{label: 'PDND v.1', variant: 'pdnd'}, {label: 'Profilo:PDND', variant: 'profilo'}]"
 *   [maxTags]="3"
 *   (action)="onShow(api)"
 * ></lnk-api-row>
 * ```
 */
@Component({
  selector: 'lnk-api-row',
  standalone: true,
  imports: [CommonModule, PopoverModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="api"
         role="button"
         [attr.tabindex]="0"
         [attr.aria-label]="nome"
         (click)="action.emit($event)"
         (keydown.enter)="action.emit($event)"
         (keydown.space)="action.emit($event); $event.preventDefault()">
      <div class="av">
        <i class="bi" [ngClass]="iconClass"></i>
      </div>
      <div class="body">
        <div class="name">
          <span class="text-break">{{ nome }}</span>
          @if (versione) {
            <span class="ver">v.{{ versione }}</span>
          }
        </div>
        @if (descrizione) {
          <div class="desc">{{ descrizione }}</div>
        }
      </div>
      <div class="tags">
        @for (t of _visibleTags(); track $index) {
          <span class="tag"
                [ngClass]="[t.variant || 'custom', t.value ? 'is-split' : '']">
            <span class="tag-label">{{ t.label }}</span>
            @if (t.value) {
              <span class="tag-value">{{ t.value }}</span>
            }
          </span>
        }
        @if (_hiddenTags().length > 0) {
          <button type="button"
                  class="tag tag-more"
                  [popover]="overflowPopTpl"
                  [outsideClick]="true"
                  containerClass="lnk-api-row-overflow-pop"
                  placement="bottom"
                  container="body"
                  (click)="$event.stopPropagation()"
                  [attr.aria-label]="'+' + _hiddenTags().length">
            +{{ _hiddenTags().length }}
          </button>
          <ng-template #overflowPopTpl>
            <div class="lnk-api-row-overflow-list">
              @for (t of _hiddenTags(); track $index) {
                <span class="tag"
                      [ngClass]="[t.variant || 'custom', t.value ? 'is-split' : '']">
                  <span class="tag-label">{{ t.label }}</span>
                  @if (t.value) {
                    <span class="tag-value">{{ t.value }}</span>
                  }
                </span>
              }
            </div>
          </ng-template>
        }
      </div>
      <div class="api-chev"><i class="bi bi-chevron-right"></i></div>
    </div>
  `,
})
export class ApiRowComponent {
  @Input() nome: string = '';
  @Input() versione: string | number | null = null;
  @Input() descrizione: string | null = null;
  /** Classe `bootstrap-icons` per l'avatar. Default `bi-bezier2`. */
  @Input() iconClass: string = 'bi-bezier2';

  private readonly _tagsSig = signal<LnkApiTag[]>([]);
  /**
   * Soglia oltre la quale i tag extra vengono raggruppati in `+n`.
   * `null` disabilita il raggruppamento (mostra tutti). Default `3`.
   */
  private readonly _maxTagsSig = signal<number | null>(3);

  @Input() set tags(v: LnkApiTag[]) { this._tagsSig.set(v ?? []); }
  get tags(): LnkApiTag[] { return this._tagsSig(); }

  @Input() set maxTags(v: number | null | undefined) { this._maxTagsSig.set(v ?? null); }
  get maxTags(): number | null { return this._maxTagsSig(); }

  /** Emessa al click/Enter/Space sulla riga. */
  @Output() action = new EventEmitter<Event>();

  /**
   * Lista dei tag visibili nella riga. Se la lista totale supera la
   * soglia `maxTags`, riempie fino a (maxTags - 1) elementi e lascia
   * un posto per il bottone "+n". Il tag `profilo` viene ancorato
   * sempre come primo elemento visibile (anche se non era nella
   * fetta iniziale).
   */
  _visibleTags = computed<LnkApiTag[]>(() => {
    const all = this._tagsSig();
    const max = this._maxTagsSig();
    if (max == null || all.length <= max) return all;
    const profilo = all.find(t => t.variant === 'profilo');
    const others = profilo ? all.filter(t => t !== profilo) : all;
    const slots = max - 1; // un slot e` riservato al bottone "+n"
    if (profilo) {
      return [profilo, ...others.slice(0, Math.max(0, slots - 1))];
    }
    return others.slice(0, slots);
  });

  /**
   * Tag NON renderizzati in riga (mostrati nel popover "+n").
   */
  _hiddenTags = computed<LnkApiTag[]>(() => {
    const all = this._tagsSig();
    const visible = this._visibleTags();
    if (visible.length === all.length) return [];
    return all.filter(t => !visible.includes(t));
  });
}
