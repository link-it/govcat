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
import { Component, Input, SimpleChanges } from '@angular/core';

@Component({
    selector: 'ui-placeholder-loading',
    styleUrls: ['./placeholder-loading.component.scss'],
    templateUrl: './placeholder-loading.component.html',
    standalone: false
})
export class PlaceholderLoadingComponent {
  @Input() type: string = 'list'; // list - card
  @Input() count: number = 3;
  @Input() col: number = 4;
  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() rounded: boolean = false;

  range_arr: number[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['count']) {
      this.range_arr = Array.from({length: changes['count'].currentValue}, (_, i) => i + 1);
    }
  }
}
