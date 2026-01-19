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

@Component({
  selector: 'lnk-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss'],
  standalone: false
})
export class LnkCardComponent implements OnInit {

  @Input('image') _image: string = '';
  @Input('showImage') _showImage: boolean = true;
  @Input('showEmptyImage') _showEmptyImage: boolean = true;
  @Input('primaryText') _primaryText: string = '';
  @Input('secondaryText') _secondaryText: string = '';
  @Input('metadata') _metadata: string = '';
  @Input('readMore') _readMore: string = 'Leggi tutto';
  @Input('collapsed') _collapsed: boolean = true;
  @Input('checkDisabled') _checkDisabled: boolean = false;
  @Input('editMode') _editMode: boolean = false;
  @Input('editColor') _editColor!: string;
  @Input('backColor') _backColor: string = '#f1f1f1';
  @Input('textColor') _textColor: string = '#000000';
  @Input('numberCharLogoText') _numberCharLogoText: number = 2;
  @Input('enabledImageLink') _enabledImageLink: boolean = false;
  @Input('cardBs') cardBs: boolean = false;
  @Input('data') data: any = null;
  @Input('config') config: any = null;
  @Input('isAnonymous') isAnonymous: boolean = false;
  @Input('showGroupIcon') showGroupIcon: boolean = false;
  @Input('showGroupLabel') showGroupLabel: boolean = false;
  @Input('groupLabel') groupLabel: string = 'Group';

  @Output() editSelection: EventEmitter<any> = new EventEmitter();
  @Output() simpleClick: EventEmitter<any> = new EventEmitter();

  _logoText: string = '';

  constructor(
    // public utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    this._logoText = this._primaryText.slice(0, this._numberCharLogoText);
    if (this._image) {
      this._backColor = '#f1f1f1';
    }
    this._textColor = '#111111'; // this.utilsLib.contrast(this._backColor);
  }

  __simpleClick(event: any) {
    if (!this._editMode) {
      this.simpleClick.emit(event);
    }
  }

  __imageClick(event: any) {
    if (this._enabledImageLink) {
      if (!this._editMode) {
        this.simpleClick.emit(event);
      }
    }
  }
}
