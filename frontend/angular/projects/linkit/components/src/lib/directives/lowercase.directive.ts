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
import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';

@Directive({
    selector: '[appTextLowercase]',
    standalone: false
})
export class TextLowercaseDirective {
  preValue: string = "";

  constructor(private elmRef: ElementRef, private renderer: Renderer2) { }

  @HostListener('input', ['$event']) onInput(event: any) {
    const text_lower = event.target.value.toLowerCase();
    if (!this.preValue || (this.preValue && text_lower && this.preValue !== text_lower)) {
      this.preValue = text_lower;
      this.renderer.setProperty(this.elmRef.nativeElement, 'value', text_lower);
      const htmlEvent = new Event('input', {
        "bubbles": false, "cancelable": true
      });
      document.dispatchEvent(htmlEvent);
    }
  };
}
