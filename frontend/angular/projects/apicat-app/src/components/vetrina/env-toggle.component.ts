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
  imports: [CommonModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="env-toggle">
      <button type="button"
              [class.is-on]="env === 'collaudo'"
              class="coll"
              (click)="change.emit('collaudo')">{{ 'APP.BUTTON.Testing' | translate }}</button>
      <button type="button"
              [class.is-on]="env === 'produzione'"
              class="prod"
              (click)="change.emit('produzione')">{{ 'APP.BUTTON.Production' | translate }}</button>
    </div>
  `,
})
export class EnvToggleComponent {
  @Input() env: EnvValue = 'collaudo';
  @Output() change = new EventEmitter<EnvValue>();
}
