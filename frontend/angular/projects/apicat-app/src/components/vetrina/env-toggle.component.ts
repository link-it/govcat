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
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

export type EnvValue = 'collaudo' | 'produzione';

/**
 * Toggle Collaudo / Produzione per la pagina vetrina. I label sono
 * localizzati via i18n (`APP.LABEL.Collaudo`, `APP.LABEL.Produzione`)
 * con fallback inline.
 *
 * Estratto da `mock-views/app/shared/env-toggle.component.ts`.
 */
@Component({
  selector: 'lnk-env-toggle',
  standalone: true,
  imports: [CommonModule, TranslateModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="env-toggle">
      <button type="button"
              [class.is-on]="env === 'collaudo'"
              [class.is-disabled]="collaudoDisabled"
              [attr.aria-disabled]="collaudoDisabled || null"
              [attr.aria-describedby]="collaudoDisabled && collaudoDisabledTooltip ? _tooltipId : null"
              [tooltip]="collaudoDisabled && collaudoDisabledTooltip ? (collaudoDisabledTooltip | translate) : ''"
              container="body"
              class="coll"
              (click)="_onCollaudo()">{{ 'APP.BUTTON.Testing' | translate }}</button>
      <button type="button"
              [class.is-on]="env === 'produzione'"
              class="prod"
              (click)="change.emit('produzione')">{{ 'APP.BUTTON.Production' | translate }}</button>
      @if (collaudoDisabled && collaudoDisabledTooltip) {
        <span class="visually-hidden" [id]="_tooltipId">{{ collaudoDisabledTooltip | translate }}</span>
      }
    </div>
  `,
})
export class EnvToggleComponent {
  private static _seq = 0;

  @Input() env: EnvValue = 'collaudo';
  /** Collaudo non selezionabile (es. collaudo saltato): resta focalizzabile per mostrare il motivo. */
  @Input() collaudoDisabled: boolean = false;
  /** Chiave i18n del motivo, mostrata come tooltip sul pulsante Collaudo disabilitato. */
  @Input() collaudoDisabledTooltip: string = '';
  @Output() change = new EventEmitter<EnvValue>();

  readonly _tooltipId = `env-toggle-coll-${++EnvToggleComponent._seq}`;

  _onCollaudo() {
    if (this.collaudoDisabled) { return; }
    this.change.emit('collaudo');
  }
}
