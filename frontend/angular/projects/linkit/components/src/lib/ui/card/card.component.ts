import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';

import { UtilsLib } from '../../utils/utils.lib';
import { EditColor } from '../classes/definitions';

export enum CardType {
  Simple = 'Simple',
  Extended = 'Extended'
}

@Component({
    selector: 'ui-card',
    templateUrl: './card.component.html',
    styleUrls: ['./card.component.scss'],
    standalone: false
})
export class CardComponent implements OnInit {
  @HostListener('click', ['$event']) onClick(event: any) {
    if (this._type === CardType.Simple) {
      this.__simpleClick(event);
    }
  }
  @Input('type') _type: CardType = CardType.Simple;
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
  @Input('editColor') _editColor!: EditColor;
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

  CardType = CardType;

  _logoText: string = '';

  constructor(
    public utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    this._logoText = this._primaryText.slice(0, this._numberCharLogoText);
    if (this._image) {
      this._backColor = '#f1f1f1';
    }
    this._textColor = this.utilsLib.contrast(this._backColor);
  }

  __change(event: any) {
    this.editSelection.emit({ selected: event.checked });
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
