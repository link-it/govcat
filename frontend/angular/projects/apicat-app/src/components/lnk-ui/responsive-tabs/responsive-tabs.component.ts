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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export interface ResponsiveTab {
  /** Identificativo univoco della tab. */
  key: string;
  /** Chiave i18n della label visualizzata. */
  label: string;
  /** Etichetta accessibile opzionale (default = label tradotta). */
  ariaLabel?: string;
}

@Component({
  selector: 'lnk-responsive-tabs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './responsive-tabs.component.html',
  styleUrls: ['./responsive-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResponsiveTabsComponent {
  private readonly _items = signal<ResponsiveTab[]>([]);
  private readonly _active = signal<string>('');

  @Input() set items(v: ResponsiveTab[]) { this._items.set(v ?? []); }
  get items(): ResponsiveTab[] { return this._items(); }

  @Input() set active(v: string) { this._active.set(v ?? ''); }
  get active(): string { return this._active(); }

  /** Conteggio mostrato come badge accanto alla tab attiva. */
  @Input() activeCount: number | null = null;
  /** Sostituisce il counter con uno spinner quando true. */
  @Input() loading: boolean = false;

  @Output() activeChange = new EventEmitter<string>();

  _activeItem = computed<ResponsiveTab | undefined>(() => {
    const key = this._active();
    return this._items().find(t => t.key === key);
  });

  select(key: string): void {
    if (key === this._active()) { return; }
    this._active.set(key);
    this.activeChange.emit(key);
  }
}
