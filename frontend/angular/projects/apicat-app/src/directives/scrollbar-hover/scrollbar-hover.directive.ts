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

/**
 * ScrollbarHoverDirective
 *
 * Direttiva per mostrare/nascondere la scrollbar al passaggio del mouse su un elemento specifico.
 * Utile quando si vuole applicare il comportamento hide-on-idle a singoli container
 * invece che globalmente (per l'approccio globale, usare Scrollbar.hideOnIdle nel config).
 *
 * Uso:
 *   1. Importare ScrollbarHoverModule nel modulo del componente
 *   2. Applicare la direttiva all'elemento con overflow:
 *      <div class="my-scrollable-container" [scrollbarHover]="true">...</div>
 *   3. Assicurarsi che Scrollbar.hideOnIdle sia true nel config
 *
 * Nota: Richiede la classe CSS 'scrollbar-hide-on-idle' definita in app-scrollbar.scss
 */
import { Directive, ElementRef, HostListener, OnInit, OnDestroy, Input } from '@angular/core';
import { ConfigService } from '@linkit/components';

@Directive({
  selector: '[scrollbarHover]',
  standalone: false
})
export class ScrollbarHoverDirective implements OnInit, OnDestroy {

  @Input() scrollbarHover: boolean = true;

  private hideOnIdle: boolean = false;
  private hideTimeout: any;
  private hideDelay: number = 1000;

  constructor(
    private el: ElementRef,
    private config: ConfigService
  ) {
    this.hideOnIdle = this.config?.getAppConfig()?.Scrollbar?.hideOnIdle || false;
  }

  ngOnInit(): void {
    if (this.hideOnIdle && this.scrollbarHover) {
      this.el.nativeElement.classList.add('scrollbar-hide-on-idle');
    }
  }

  ngOnDestroy(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  @HostListener('mouseenter')
  onMouseEnter(): void {
    if (this.hideOnIdle && this.scrollbarHover) {
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.el.nativeElement.classList.add('scrollbar-visible');
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    if (this.hideOnIdle && this.scrollbarHover) {
      this.hideTimeout = setTimeout(() => {
        this.el.nativeElement.classList.remove('scrollbar-visible');
      }, this.hideDelay);
    }
  }

  @HostListener('scroll')
  onScroll(): void {
    if (this.hideOnIdle && this.scrollbarHover) {
      this.el.nativeElement.classList.add('scrollbar-visible');
      if (this.hideTimeout) {
        clearTimeout(this.hideTimeout);
      }
      this.hideTimeout = setTimeout(() => {
        this.el.nativeElement.classList.remove('scrollbar-visible');
      }, this.hideDelay);
    }
  }
}
