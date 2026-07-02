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
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export type PillTabBadgeTone = 'pending' | 'warning' | 'info' | 'success';

export interface PillTabBadge {
  /** Classe bootstrap-icons (es. 'bi-hourglass-split'). */
  icon: string;
  /** Chiave i18n per aria-label/title. */
  ariaLabel?: string;
  /** Variante di colore del badge. Default `pending`. */
  tone?: PillTabBadgeTone;
}

export interface PillTab {
  /** Identificativo univoco della tab. */
  key: string;
  /** Chiave i18n della label. */
  label: string;
  /** Classe bootstrap-icons opzionale (es. 'bi-person-vcard'). */
  icon?: string;
  /** Contatore mostrato come pill numerica. Nascosto se null/0. */
  count?: number | null;
  /** Badge di stato (icona) accanto alla label (es. richiesta pending). */
  badge?: PillTabBadge;
}

@Component({
  selector: 'lnk-pill-tabs',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './pill-tabs.component.html',
  styleUrls: ['./pill-tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PillTabsComponent {
  private readonly _items = signal<PillTab[]>([]);
  private readonly _active = signal<string>('');

  @Input() set items(v: PillTab[]) { this._items.set(v ?? []); }
  get items(): PillTab[] { return this._items(); }

  @Input() set active(v: string) { this._active.set(v ?? ''); }
  get active(): string { return this._active(); }

  /** Chiave i18n per aria-label del <nav> wrapper. */
  @Input() ariaLabel?: string;

  @Output() activeChange = new EventEmitter<string>();

  select(key: string): void {
    if (key === this._active()) { return; }
    this._active.set(key);
    this.activeChange.emit(key);
  }
}
