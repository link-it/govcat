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
import { AfterViewInit, Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output } from '@angular/core';

@Directive({
  selector: '[autoFillScroll]',
  standalone: true
})
export class AutoFillScrollDirective implements AfterViewInit, OnDestroy {

  @Input() autoFillScroll: boolean = true;
  @Output() autoFillNeeded: EventEmitter<void> = new EventEmitter();

  private _observer: MutationObserver | null = null;
  private _checkTimeout: any = null;
  private _lastEmittedHeight: number = -1;
  private _destroyed = false;

  constructor(private readonly el: ElementRef, private ngZone: NgZone) {}

  ngAfterViewInit() {
    // Create MutationObserver OUTSIDE Angular zone so its callback
    // does not trigger change detection. Zone.js patches MutationObserver,
    // so without this, every callback would trigger CD → DOM mutations →
    // another MutationObserver callback → CD → infinite loop.
    this.ngZone.runOutsideAngular(() => {
      this._observer = new MutationObserver(() => this._onMutation());
      this._observer.observe(this.el.nativeElement, { childList: true, subtree: true });
    });
  }

  ngOnDestroy() {
    this._destroyed = true;
    this._observer?.disconnect();
    if (this._checkTimeout) {
      clearTimeout(this._checkTimeout);
    }
  }

  private _onMutation() {
    if (!this.autoFillScroll || this._destroyed) return;

    if (this._checkTimeout) {
      clearTimeout(this._checkTimeout);
    }

    this._checkTimeout = setTimeout(() => {
      if (this._destroyed) return;
      const el = this.el.nativeElement;
      if (!el) return;

      if (el.scrollHeight > el.clientHeight) {
        // Container is full, reset for future checks
        this._lastEmittedHeight = -1;
        return;
      }

      // Container not full: only emit if scrollHeight changed since last emit
      // (meaning new content was rendered, or this is the first check).
      // If scrollHeight is unchanged, no new content was loaded — stop emitting.
      if (el.scrollHeight !== this._lastEmittedHeight) {
        this._lastEmittedHeight = el.scrollHeight;
        // Enter Angular zone only for the emit so the component handler
        // runs inside the zone and triggers proper change detection.
        this.ngZone.run(() => this.autoFillNeeded.emit());
      }
    }, 200);
  }
}
