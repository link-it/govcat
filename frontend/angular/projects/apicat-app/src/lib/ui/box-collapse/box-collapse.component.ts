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
import { Component, Input, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'ui-box-collapse',
    template: `
    <div class="settings {{ _id }} {{ _class }}" [class.expanded]="_opened">
      <div class="settings-header">
        @if (!_showCollapse) {
          <h4 class="settings-title collapsed">{{ _title }}</h4>
        }
        @if (_showCollapse) {
          <h4 class="settings-title collapsed" data-bs-toggle="collapse" [attr.data-bs-target]="'#'+_id" (click)="_toggle()">{{ _title }}</h4>
          @if (_showCollapse) {
            <button class="btn gl-button btn-default js-settings-toggle collapsed" type="button" data-bs-toggle="collapse" [attr.data-bs-target]="'#'+_id" (click)="_toggle()">
              @if (_opened) {
                <span>{{ 'APP.BUTTON.Collapse' | translate }}</span>
              }
              @if (!_opened) {
                <span>{{ 'APP.BUTTON.Expand' | translate }}</span>
              }
            </button>
          }
        }
        <p>{{ _subTitle }}</p>
      </div>
      <div [attr.id]="_id" class="settings-content collapse">
        <ng-content></ng-content>
      </div>
    </div>
    `,
    styles: [`
    :host { display: contents; }
  `],
    standalone: true,
    imports: [TranslateModule]
})
export class BoxCollapseComponent implements AfterViewInit, OnChanges {

  @Input('id') _id: string = '';
  @Input('title') _title: string = '';
  @Input('subTitle') _subTitle: string = '';
  @Input('opened') _opened: boolean = false;
  @Input('class') _class: string = '';
  @Input('showCollapse') _showCollapse: boolean = true;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['opened']) {
      this._opened = changes['opened'].currentValue;
    }
  }

  ngAfterViewInit() {
    const elem = window.document.getElementById(this._id);
    if (elem && this._opened) {
      elem.classList.add('show');
    }
  }

  _toggle() {
    this._opened = !this._opened;
  }
}
