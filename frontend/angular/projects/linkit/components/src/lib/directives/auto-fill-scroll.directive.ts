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
import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[autoFillScroll]',
  standalone: false
})
export class AutoFillScrollDirective implements AfterViewInit, OnDestroy {

  @Input() autoFillScroll: boolean = true;
  @Output() autoFillNeeded: EventEmitter<void> = new EventEmitter();

  private _observer: MutationObserver | null = null;
  private _checkTimeout: any = null;

  constructor(private readonly el: ElementRef) {}

  ngAfterViewInit() {
    this._observer = new MutationObserver(() => this._check());
    this._observer.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy() {
    this._observer?.disconnect();
    if (this._checkTimeout) {
      clearTimeout(this._checkTimeout);
    }
  }

  private _check() {
    if (!this.autoFillScroll) return;

    if (this._checkTimeout) {
      clearTimeout(this._checkTimeout);
    }

    this._checkTimeout = setTimeout(() => {
      const el = this.el.nativeElement;
      if (el && el.scrollHeight <= el.clientHeight) {
        this.autoFillNeeded.emit();
      }
    }, 150);
  }
}
