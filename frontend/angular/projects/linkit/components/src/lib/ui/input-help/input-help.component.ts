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
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'ui-input-help',
    templateUrl: './input-help.component.html',
    styleUrls: [
        './input-help.component.scss'
    ],
    standalone: false
})
export class InputHelpComponent implements OnChanges {

  @Input() field: string = '';
  @Input() context: string = '';
  @Input() params: any = {};

  _text: string = '';
  _existsValue: boolean = false;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.field = changes['field'].currentValue;
      const _value: string = this.translate.instant(`APP.LABEL_HELP.${this.context}.${this.field}`, this.params);
      this._text = `${_value}`;
      this._existsValue = !_value.includes('APP.LABEL_HELP.') && (_value !== '');
    }
  }
}
