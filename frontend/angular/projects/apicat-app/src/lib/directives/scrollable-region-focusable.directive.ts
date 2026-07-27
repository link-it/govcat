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
import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy } from '@angular/core';

/**
 * Rende operabile da tastiera il contenitore lista `section.container-scroller`.
 * Quando il contenuto va in overflow la regione diventa scorrevole ma, senza discendenti
 * focusabili, chi naviga da tastiera non può raggiungerla né scorrerla (WCAG 2.1.1,
 * axe scrollable-region-focusable). La direttiva assegna `tabindex="0"` solo quando la
 * regione è effettivamente scrollabile, evitando tab-stop inutili sulle liste corte.
 * Si applica automaticamente in ogni componente che importa le direttive condivise.
 */
@Directive({
  selector: 'section.container-scroller',
  standalone: true
})
export class ScrollableRegionFocusableDirective implements AfterViewInit, OnDestroy {

  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private frame = 0;

  constructor(
    private readonly elementRef: ElementRef<HTMLElement>,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    const el = this.elementRef.nativeElement;
    this.zone.runOutsideAngular(() => {
      this.resizeObserver = new ResizeObserver(() => this.scheduleUpdate());
      this.resizeObserver.observe(el);
      // L'infinite-scroll aggiunge figli senza cambiare il box della sezione: osservo anche il contenuto.
      this.mutationObserver = new MutationObserver(() => this.scheduleUpdate());
      this.mutationObserver.observe(el, { childList: true, subtree: true });
    });
    this.updateTabindex();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    if (this.frame) {
      cancelAnimationFrame(this.frame);
    }
  }

  private scheduleUpdate(): void {
    if (this.frame) {
      return;
    }
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.updateTabindex();
    });
  }

  private updateTabindex(): void {
    const el = this.elementRef.nativeElement;
    const scrollable = el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
    if (scrollable) {
      if (el.getAttribute('tabindex') !== '0') {
        el.setAttribute('tabindex', '0');
      }
    } else if (el.getAttribute('tabindex') === '0' && el !== document.activeElement) {
      // Non rimuovo il tabindex mentre la regione ha il focus, per non perderlo.
      el.removeAttribute('tabindex');
    }
  }
}
