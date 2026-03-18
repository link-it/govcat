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
import { Component, CUSTOM_ELEMENTS_SCHEMA, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';

@Component({
  selector: 'app-dashboard-panel',
  templateUrl: './dashboard-panel.component.html',
  styleUrls: ['./dashboard-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    ...APP_COMPONENTS_IMPORTS
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardPanelComponent {

  @Input() title: string = '';
  @Input() icon: string = '';
  @Input() items: any[] = [];
  @Input() totalCount: number = 0;
  @Input() panelType: 'servizi' | 'adesioni' | 'client' | 'comunicazioni' | 'utenti' = 'servizi';
  @Input() loading: boolean = false;
  @Input() borderColor: string = '#0d6efd';
  @Input() hideVersions: boolean = false;
  @Input() viewAllCount: number | null = null;
  @Input() statusConfig: { [key: string]: { label: string; background: string; color: string } } = {};

  @Output() viewAll: EventEmitter<string> = new EventEmitter();
  @Output() viewItem: EventEmitter<any> = new EventEmitter();

  onViewAll() {
    this.viewAll.emit(this.panelType);
  }

  onViewItem(item: any) {
    this.viewItem.emit(item);
  }

  getStatusStyle(stato: string): { [key: string]: string } {
    const cfg = this.statusConfig[stato];
    if (cfg) {
      return { 'background-color': cfg.background, 'color': cfg.color, 'border': 'none' };
    }
    return { 'background-color': '#6c757d', 'color': '#ffffff' };
  }

  getStatusLabel(stato: string): string {
    const cfg = this.statusConfig[stato];
    return cfg?.label || stato;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
