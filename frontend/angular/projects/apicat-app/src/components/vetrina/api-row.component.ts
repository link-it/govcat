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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  /** Testo del tag. Gia` localizzato (i18n risolto a monte). */
  label: string;
  /** Variante stilistica. Default `custom`. */
  variant?: 'pdnd' | 'profilo' | 'custom';
}

/**
 * Riga di una API nella lista vetrina. Layout grid 4-col:
 * `[avatar | body | tags | chevron]`.
 *
 * Esempio uso:
 * ```html
 * <lnk-api-row
 *   [nome]="api.nome"
 *   [versione]="api.versione"
 *   [descrizione]="api.descrizione"
 *   [tags]="[{label: 'PDND', variant: 'pdnd'}, {label: 'BASIC', variant: 'profilo'}]"
 *   (action)="onShow(api)"
 * ></lnk-api-row>
 * ```
 *
 * Riusabile fra `servizio-view` e (in futuro) altre pagine vetrina
 * che mostrano API.
 */
@Component({
  selector: 'lnk-api-row',
  standalone: true,
  imports: [CommonModule],
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
        @for (t of tags; track $index) {
          <span class="tag" [ngClass]="t.variant || 'custom'">{{ t.label }}</span>
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
  @Input() tags: LnkApiTag[] = [];
  /** Classe `bootstrap-icons` per l'avatar. Default `bi-bezier2`. */
  @Input() iconClass: string = 'bi-bezier2';

  /** Emessa al click/Enter/Space sulla riga. */
  @Output() action = new EventEmitter<Event>();
}
