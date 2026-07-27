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
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { StatoChipComponent } from '@app/components/vetrina/stato-chip.component';

@Component({
  selector: 'app-dashboard-panel',
  templateUrl: './dashboard-panel.component.html',
  styleUrls: ['./dashboard-panel.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
    ...APP_COMPONENTS_IMPORTS,
    StatoChipComponent
  ]
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

  // Badge conteggio "pill tenue": sfondo tinta chiara del colore-sezione +
  // testo colorato scurito fino a contrasto AA (>=4.5:1) sulla tinta. Derivato
  // da `borderColor`, così funziona per qualsiasi colore configurato.
  private _hexToRgb(hex: string): number[] {
    const h = (hex || '#0d6efd').replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
  }
  private _relLum(rgb: number[]): number {
    const f = (c: number) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(rgb[0]) + 0.7152 * f(rgb[1]) + 0.0722 * f(rgb[2]);
  }
  private _contrast(a: number[], b: number[]): number {
    const la = this._relLum(a) + 0.05, lb = this._relLum(b) + 0.05;
    return Math.max(la, lb) / Math.min(la, lb);
  }
  private _badgeBgRgb(): number[] {
    return this._hexToRgb(this.borderColor).map((c) => Math.round(c * 0.14 + 255 * 0.86));
  }
  get badgePillBg(): string {
    const [r, g, b] = this._badgeBgRgb();
    return `rgb(${r}, ${g}, ${b})`;
  }
  get badgePillText(): string {
    let rgb = this._hexToRgb(this.borderColor);
    const bg = this._badgeBgRgb();
    for (let i = 0; i < 30 && this._contrast(rgb, bg) < 4.6; i++) {
      rgb = rgb.map((c) => Math.round(c * 0.85));
    }
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }
  // Colore icona sezione scurito fino a contrasto >=3:1 su bianco (WCAG 1.4.11
  // non-testo): i colori chiari (giallo/verde) su bianco erano < 3:1.
  get iconColor(): string {
    let rgb = this._hexToRgb(this.borderColor);
    const white = [255, 255, 255];
    for (let i = 0; i < 30 && this._contrast(rgb, white) < 3.2; i++) {
      rgb = rgb.map((c) => Math.round(c * 0.85));
    }
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
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

  isCertExpired(dateStr: string): boolean {
    if (!dateStr) return false;
    return new Date(dateStr).getTime() <= Date.now();
  }
}
