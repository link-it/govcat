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

@Component({
    selector: 'ui-data-collapse',
    template: `
    <div class="{{ _id }} {{ _class }}" [class.expanded]="_opened">
      <div class="w-100">
        <button type="button" class="btn gl-button btn-default js-settings-toggle button-action" (click)="_toggle()">
          <span *ngIf="!_opened">{{ _titleOpen | translate }} <em class="bi bi-chevron-down ms-1"></em></span>
          <span *ngIf="_opened">{{ _titleClose | translate }} <em class="bi bi-chevron-up ms-1"></em></span>
        </button>
      </div>
      <div [attr.id]="_id" class="collapse mt-1" [class.show]="_opened">
        <ng-content></ng-content>
      </div>
    </div>
  `,
    styles: [`
    :host { display: contents; }
  `],
    standalone: false
})
export class DataCollapseComponent implements AfterViewInit, OnChanges {

  @Input('id') _id: string = '';
  @Input('titleOpen') _titleOpen: string = '';
  @Input('titleClose') _titleClose: string = '';
  @Input('opened') _opened: boolean = false;
  @Input('class') _class: string = '';

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
