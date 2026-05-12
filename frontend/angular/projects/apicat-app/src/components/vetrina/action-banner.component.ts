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

export type LnkActionBannerVariant = 'accent' | 'info' | 'warn' | 'muted' | 'ok';

/**
 * Banner di call-to-action / messaggio contestuale per le pagine
 * vetrina. Layout:
 *
 *   [ icon | title + subtitle ............................. | CTA ]
 *
 * Si renderizza come una card a tutta larghezza, con sfondo
 * "soft" della variante scelta. Il `[ctaLabel]` e` opzionale —
 * senza CTA il banner diventa un messaggio informativo
 * (es. "Adesione gia` esistente").
 *
 * Estratto come componente riusabile per supportare lo stacking
 * verticale di piu` messaggi (es. su `servizio-view`, dove ci
 * sono CTA "Aderisci" + alert "OrgNonAmmissibile" + info
 * "AdesioniPrecedenti" che vanno mostrati in sequenza sotto
 * l'hero).
 */
@Component({
  selector: 'lnk-action-banner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="action-banner"
         [ngClass]="'is-' + variant">
      <div class="ab-icon">
        @if (icon) {
          <i class="bi" [ngClass]="icon"></i>
        }
      </div>
      <div class="ab-body">
        <div class="ab-title">{{ title }}</div>
        @if (subtitle) {
          <div class="ab-subtitle">{{ subtitle }}</div>
        }
      </div>
      @if (ctaLabel) {
        <div class="ab-cta">
          <button type="button"
                  class="btnc"
                  [ngClass]="ctaButtonClass()"
                  [disabled]="ctaDisabled"
                  (click)="action.emit($event)"
                  (auxclick)="action.emit($event)">
            @if (ctaIcon) {
              <i class="bi me-2" [ngClass]="ctaIcon"></i>
            }
            <span>{{ ctaLabel }}</span>
          </button>
        </div>
      }
    </div>
  `,
})
export class ActionBannerComponent {
  @Input() icon: string = '';
  @Input() title: string = '';
  @Input() subtitle: string | null = null;
  @Input() ctaLabel: string | null = null;
  @Input() ctaIcon: string | null = null;
  @Input() ctaDisabled: boolean = false;
  /** Variante visuale: palette dello sfondo + icona + bottone. */
  @Input() variant: LnkActionBannerVariant = 'accent';

  /** Emessa al click/middle-click sul bottone CTA. */
  @Output() action = new EventEmitter<MouseEvent>();

  /** Classe del bottone CTA — rosso pieno per `accent`/`warn`,
   *  default outline per le altre. */
  ctaButtonClass(): string {
    return this.variant === 'accent' || this.variant === 'warn'
      ? 'btnc-accent'
      : 'btnc-default';
  }
}
