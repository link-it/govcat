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
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

let nextId = 0;

/** Contenuto ad altezza limitata con pulsante "Mostra tutto/Mostra meno", visibile solo se il contenuto eccede. */
@Component({
  selector: 'lnk-collapsible-text',
  templateUrl: './collapsible-text.component.html',
  styleUrls: ['./collapsible-text.component.scss'],
  standalone: true,
  imports: [TranslateModule]
})
export class LnkCollapsibleTextComponent implements AfterViewInit, OnDestroy {

  @Input() maxHeight: number = 120;

  @ViewChild('content', { static: true }) content!: ElementRef<HTMLElement>;

  // Margine oltre il limite entro cui il contenuto resta intero: evita di nascondere una sola riga
  static readonly TOLLERANZA = 24;

  readonly _id = `lnk-collapsible-${++nextId}`;
  _expanded: boolean = false;
  _overflow: boolean = false;

  private _observer?: ResizeObserver;

  constructor(
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) { }

  ngAfterViewInit(): void {
    this._measure();
    if (typeof ResizeObserver === 'undefined') { return; }
    this._observer = new ResizeObserver(() => this.zone.run(() => this._measure()));
    this._observer.observe(this.content.nativeElement);
  }

  ngOnDestroy(): void {
    this._observer?.disconnect();
  }

  _toggle(): void {
    this._expanded = !this._expanded;
  }

  _measure(): void {
    const _overflow = this._eccede(this.content.nativeElement.scrollHeight);
    if (_overflow !== this._overflow) {
      this._overflow = _overflow;
      this.cdr.detectChanges();
    }
  }

  _eccede(altezza: number): boolean {
    return altezza > this.maxHeight + LnkCollapsibleTextComponent.TOLLERANZA;
  }
}
