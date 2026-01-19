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
import { Directive, ElementRef, Input, OnChanges, OnInit, Renderer2, SimpleChanges } from '@angular/core';
import { SafeUrl } from '@angular/platform-browser';

@Directive({
    selector: '[setBackgroundImage]',
    standalone: false
})
export class SetBackgroundImageDirective implements OnInit, OnChanges {

  @Input() imageUrl!: string | SafeUrl;
  @Input() position: string = 'contain';

  constructor(private elementRef:ElementRef, private renderer: Renderer2) {}

  ngOnInit() {
    this.renderer.setStyle(this.elementRef.nativeElement, 'backgroundImage', `url(${this.imageUrl})`);
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-size', this.position);
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-position', 'center');
    this.renderer.setStyle(this.elementRef.nativeElement, 'background-repeat', 'no-repeat');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']?.currentValue && !changes['imageUrl']?.firstChange) {
      this.imageUrl = changes['imageUrl'].currentValue['changingThisBreaksApplicationSecurity'] || changes['imageUrl'].currentValue;
      this.renderer.setStyle(this.elementRef.nativeElement, 'backgroundImage', `url(${this.imageUrl})`);
    }
  }
}
