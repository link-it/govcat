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
import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';
import { Input, Output } from '@angular/core';

@Directive({
    selector: '[appHtmlAttr]',
    standalone: false
})
export class HtmlAttributesDirective implements OnInit {
  @Input() appHtmlAttr!: { [key: string]: string } | undefined;

  constructor(
    private renderer: Renderer2,
    private el: ElementRef
  ) { }

  ngOnInit() {
    const attribs = this.appHtmlAttr;
    for (const attr in attribs) {
      if (attr === 'style' && typeof (attribs[attr]) === 'object') {
        this.setStyle(attribs[attr]);
      } else if (attr === 'class') {
        this.addClass(attribs[attr]);
      } else {
        this.setAttrib(attr, attribs[attr]);
      }
    }
  }

  private setStyle(styles: any) {
    for (const style in styles) {
      this.renderer.setStyle(this.el.nativeElement, style, styles[style]);
    }
  }

  private addClass(classes: any) {
    const classArray = (Array.isArray(classes) ? classes : classes.split(' '));
    classArray.filter((element: any) => element.length > 0).forEach((element: any) => {
      this.renderer.addClass(this.el.nativeElement, element);
    });
  }

  private setAttrib(key: string, value: string) {
    value !== null ?
      this.renderer.setAttribute(this.el.nativeElement, key, value) :
      this.renderer.removeAttribute(this.el.nativeElement, key);
  }
}
