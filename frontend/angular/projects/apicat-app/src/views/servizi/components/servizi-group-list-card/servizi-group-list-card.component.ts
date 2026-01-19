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
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UtilsLib } from 'projects/linkit/components/src/lib/utils/utils.lib';

@Component({
  selector: 'app-servizi-group-list-card',
  templateUrl: './servizi-group-list-card.component.html',
  styleUrls: ['./servizi-group-list-card.component.scss'],
  standalone: false
})
export class ServiziGroupListCardComponent implements OnInit {

  @Input() data: any = null;
  @Input() config: any = null;
  @Input() isAnonymous: boolean = false;
  @Input() image: string = '';
  @Input() showImage: boolean = true;
  @Input() showEmptyImage: boolean = true;
  @Input() primaryText: string = '';
  @Input() secondaryText: string = '';
  @Input() metadata: string = '';
  @Input() backColor: string = '#f1f1f1';
  @Input() textColor: string = '#000000';
  @Input() numberCharLogoText: number = 2;
  @Input() enabledImageLink: boolean = false;
  @Input() showGroupIcon: boolean = false;
  @Input() showGroupLabel: boolean = false;
  @Input() groupLabel: string = 'Group';

  @Output() simpleClick: EventEmitter<any> = new EventEmitter();

  logoText: string = '';

  constructor(private utilsLib: UtilsLib) { }

  ngOnInit() {
    this.logoText = this.primaryText.slice(0, this.numberCharLogoText);
    if (this.image) {
      this.backColor = '#f1f1f1';
    }
    this.textColor = this.utilsLib.contrast(this.backColor);
  }

  onCardClick(event: any) {
    this.simpleClick.emit(event);
  }

  onImageClick(event: any) {
    if (this.enabledImageLink) {
      this.simpleClick.emit(event);
    }
  }
}
