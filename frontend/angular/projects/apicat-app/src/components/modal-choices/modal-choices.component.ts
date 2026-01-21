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
import { Component, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Subject } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';
import { BsModalRef } from 'ngx-bootstrap/modal';

import * as _ from 'lodash';

@Component({
  selector: 'app-modal-choices',
  templateUrl: './modal-choices.component.html',
  styleUrls: ['./modal-choices.component.scss'],
  standalone: false
})
export class ModalChoicesComponent implements OnInit, OnChanges {

  list: any[] = [];
  selected: any[] = [];
  _list: any[] = [];

  onClose!: Subject<any>;

  loading = false;

  filter = '';
  searched = false;

  constructor(
    public bsModalRef: BsModalRef,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.onClose = new Subject();
    this._list = [ ...this.list ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.list) {
      this.list = changes.list.currentValue;
      this._list = { ...this.list };
    }
    if (changes.selected) {
      this.selected = changes.selected.currentValue;
    }
  }

  closeModal() {
    this.bsModalRef.hide();
  }

  onSelected() {
    this.onClose.next(this.selected);
    this.bsModalRef.hide();
  }

  onSelectAll() {
    this.selected = [ ...this.list ];
    // this.onClose.next(this.list);
    // this.bsModalRef.hide();
  }

  onDeselectAll() {
    this.selected = [];
  }

  selectItem(item: any) {
    if (this.isSelected(item)) {
      this.selected = _.filter(this.selected, (o) => (typeof o === 'string') ? o !== item : o.value !== item.value);
    } else {
      this.selected.push(item);
    }
  }

  isSelected(item: any) {
    return (_.findIndex(this.selected, function(o) { return (typeof o === 'string') ? o === item : o.value === item.value; }) !== -1);
  }

  filterChanged(event: any) {
    // event.preventDefault();
    this.list = this._list.filter((o: any) => (typeof o === 'string') ? (o.toString().toLowerCase().includes(this.filter.toLowerCase())) : (o.value.toString().toLowerCase().includes(this.filter.toLowerCase())));
    // this.list = this._list.filter((o) => o.toString().toLowerCase().includes(this.filter.toLowerCase()));
  }

  clearFilter(event: any) {
    event.preventDefault();
    this.filter = '';
    this.list = [ ...this._list ];
    this.searched = false;
  }
}
