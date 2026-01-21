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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { MenuAction } from '@linkit/components';

@Component({
  selector: 'lnk-dropdown-button',
  templateUrl: './dropdown-button.component.html',
  styleUrls: ['./dropdown-button.component.scss'],
  standalone: false
})
export class LnkDropdwnButtonComponent implements OnInit {

  @Input() title: string = 'menu';
  @Input() icon: string = '';
  @Input() items: MenuAction[] = [];
  @Input() menuEnd: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {
  }

  onAction(menu: any) {
    this.action.emit(menu.action);
  }
}
