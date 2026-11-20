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
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

/** Segnala un referente che non ha più un ruolo valido nell'organizzazione. */
@Component({
  selector: 'lnk-ruolo-non-valido',
  standalone: true,
  imports: [TranslateModule, TooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="lnk-pill lnk-pill-warn lnk-pill-sm" [tooltip]="'APP.TOOLTIP.RuoloNonValido' | translate" container="body">
      <i class="bi bi-exclamation-triangle me-1" aria-hidden="true"></i>{{ 'APP.LABEL.RuoloNonValido' | translate }}
      <span class="visually-hidden">: {{ 'APP.TOOLTIP.RuoloNonValido' | translate }}</span>
    </span>
  `
})
export class LnkRuoloNonValidoComponent {}
