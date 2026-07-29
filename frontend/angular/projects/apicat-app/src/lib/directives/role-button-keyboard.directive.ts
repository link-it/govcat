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
import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Rende attivabili da tastiera (Enter / Spazio) gli ancora usati come pulsanti
 * `<a role="button">` privi di `href` (es. voci di menu sidebar, tab): un ancora senza
 * href non emette `click` alla pressione di Enter, quindi con solo `(click)` non erano
 * operabili da tastiera (WCAG 2.1.1). Gli ancora con `href`/`routerLink` sono esclusi
 * (`:not([href])`) perche' attivano gia` nativamente. La direttiva sintetizza il click
 * sul solo elemento host quando riceve Enter/Spazio.
 */
@Directive({
  selector: 'a[role="button"]:not([href])',
  standalone: true
})
export class RoleButtonKeyboardDirective {

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.target !== this.elementRef.nativeElement) {
      return;
    }
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.elementRef.nativeElement.click();
    }
  }
}
