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
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';

@Component({
  selector: 'lnk-icon-toggle',
  templateUrl: './icon-toggle.component.html',
  styleUrls: ['./icon-toggle.component.scss'],
  standalone: false
})
export class LnkIconToggleComponent implements OnInit, OnChanges {

  @Input() value: number = 2; // 0 = unchecked, 1 = checked, 2 = Indeterminate
  @Input() iconChecked: string = 'bi bi-check-circle text-success';
  @Input() iconUnchecked: string = 'bi bi-x-circle text-danger';
  @Input() iconIndeterminate: string = 'bi bi-dash-circle text-black-50';
  @Input() tooltipChecked: string = 'APP.TOOLTIP.Completed';
  @Input() tooltipUnchecked: string = 'APP.TOOLTIP.ToBeComplete';
  @Input() tooltipIndeterminate: string = 'APP.TOOLTIP.Indeterminate';
  @Input() loading: boolean = false;
  @Input() hide: boolean = false;

  iconClass: string = '';
  tooltip: string = '';

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.value) {
      switch (changes.value.currentValue) {
        case 0:
          this.iconClass = this.iconUnchecked;
          this.tooltip = this.tooltipUnchecked;
          break;
        case 1:
          this.iconClass = this.iconChecked;
          this.tooltip = this.tooltipChecked;
          break;
        default:
          this.iconClass = this.iconIndeterminate;
          this.tooltip = this.tooltipIndeterminate;
          break;
      }
    }
  }

}
