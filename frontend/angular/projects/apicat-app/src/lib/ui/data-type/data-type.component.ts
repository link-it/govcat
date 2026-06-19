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
import { Component, EventEmitter, HostBinding, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MarkdownModule } from 'ngx-markdown';

import { UtilsLib } from '../../utils/utils.lib';
import { LnkAvatarComponent } from '@app/components/lnk-ui/avatar/avatar.component';
import { StatoChipComponent } from '@app/components/vetrina/stato-chip.component';

import moment from 'moment/moment';

@Component({
  selector: 'ui-data-type',
  templateUrl: './data-type.component.html',
  styleUrls: [
    './data-type.component.scss'
  ],
  standalone: true,
  imports: [CommonModule, TranslateModule, TooltipModule, MarkdownModule, LnkAvatarComponent, StatoChipComponent]
})
export class DataTypeComponent implements OnInit {
  @HostBinding('class.empty-space') get emptySpace(): boolean {
    return this._elem.emptySpace;
  }
  @HostBinding('class.block-space') get blockSpace(): boolean {
    return this._elem.blockSpace;
  }

  @Input('data') _data: any = null;
  @Input('elem') _elem: any = null;
  @Input('config') _config: any = null;

  @Output() dataClick: EventEmitter<any> = new EventEmitter();

  _value: any = null;

  locale = 'it-IT';
  currency = '€';
  currencyCode = 'EUR';
  digitsInfo = '1.2-2';

  _label: string = '';
  _background: string = '';
  _border: string = '';
  _color: string = '';
  _class: string = '';
  _showBadged: boolean = false;

  /** True quando il tag/label rappresenta lo `status` di
   *  un'entita`: delega il rendering al chip semantico unificato
   *  `<lnk-stato-chip>` (palette FE-side), ignorando i colori
   *  legacy hardcoded nei JSON di config. */
  _useStatoChip: boolean = false;
  _origStato: string = '';
  _statoI18nPrefix: string = 'APP.WORKFLOW.STATUS';

  /** Variante pill `.lnk-pill-<variant>` per label/tag non-stato.
   *  Letta dal config (`values[v].chipVariant` o
   *  `options[name].chipVariant`); default `muted`. */
  _chipVariant: string = 'muted';
  _chipSplitValue: string = '';
  /** Size compatto, attivato da `options[name].small: true`. */
  _chipSmall: boolean = false;

  constructor(
    private readonly sanitized: DomSanitizer,
    public utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    this._value = this.utilsLib.getObjectValue(this._data, this._elem.field);
    if (this._elem.type === 'date') {
      this._value = this.utilsLib.dateFormatter(this._value, this._elem.format);
    }
    if (this._elem.type === 'timeago') {
      this._value = moment(this._value).fromNow();
    }
    if (this._elem.type === 'mstime') {
      this._value = this.utilsLib.msToTime(this._value);
    }
    if (this._elem.type === 'status') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : 'undefined';
        this._label = (this._config.options.statusLabel) ? this._config.options.statusLabel : 'Status';
        this._background = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].background : '#1f1f1f';
        this._border = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].border : '#1f1f1f';
        this._color = (this._config.options.status && this._config.options.status[_origValue]) ? this._config.options.status[_origValue].color : '#fff';
        this._class = this._config.options.statusSmall ? 'status-label-sm' : '';
      }
    }
    if (this._elem.type === 'label') {
      // options is assigned from this._elem.options if is object or from this._config.options if present
      const options = (typeof this._elem.options === 'object') ? this._elem.options : this._config.options[this._elem.options];
      const optionsName = (typeof this._elem.options === 'string') ? this._elem.options : '';
      if (options) {
        const _origValue = this._value;
        // Allineamento palette unificata: status -> `<lnk-stato-chip>`.
        if (optionsName === 'status' && _origValue) {
          this._useStatoChip = true;
          this._origStato = _origValue;
          this._statoI18nPrefix = this._elem.i18nPrefix || 'APP.WORKFLOW.STATUS';
        } else {
          this._label = options.label ? options.label : optionsName;
          this._value = this._value ? (options.values[_origValue] ? options.values[_origValue].label : this._value) : 'undefined';
          this._background = options.values[_origValue] ? options.values[_origValue].background : '#1f1f1f';
          this._border = options.values[_origValue] ? options.values[_origValue].border : '#1f1f1f';
          this._color = options.values[_origValue] ? options.values[_origValue].color : '#fff';
          if (!options.values[_origValue] && options.values['default']) {
            this._background = options.values['default'].background;
            this._border = options.values['default'].border;
            this._color = options.values['default'].color;
          }
          this._class = options.small ? 'status-label-sm' : '';
          this._chipVariant = options.values[_origValue]?.chipVariant || options.chipVariant || 'muted';
          this._chipSplitValue = options.values[_origValue]?.splitValue || '';
          this._chipSmall = !!options.small;
        }
      }
    }
    if (this._elem.type === 'tag') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        // Allineamento palette unificata: per i tag che rappresentano
        // lo `status` di un'entita` (adesione, servizio, ecc.) delego
        // a `<lnk-stato-chip>` invece di renderizzare lo span legacy
        // coi colori hardcoded nei JSON. Per gli altri tag (es.
        // `aderente`, `boolean`, ...) resta il rendering classico.
        if (_optionsName === 'status') {
          this._useStatoChip = true;
          this._origStato = _origValue || '';
          this._statoI18nPrefix = this._elem.i18nPrefix || 'APP.WORKFLOW.STATUS';
        } else {
          this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : 'undefined';
          this._background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].background : '#1f1f1f';
          this._border = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].border : '#1f1f1f';
          this._color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].color : '#fff';
          this._showBadged = (this._elem.badged !== undefined) ? this._elem.badged : true;
          this._class = 'gl-badge badge badge-pill';
          this._class += this._config.options[_optionsName].small ? ' pt-0 pb-0' : '';
          this._chipVariant = this._config.options[_optionsName].values[_origValue]?.chipVariant || this._config.options[_optionsName].chipVariant || 'muted';
          this._chipSmall = !!this._config.options[_optionsName].small;
        }
      }
    }
    if (this._elem.type === 'text' && this._elem.truncate) {
      this._value = this.truncateRows(this._value, 2, this._elem.truncate)
    }
    if (this._elem.type === 'icon') {
      if (this._config.options) {
        const _origValue = this._value;
        const _optionsName = this._elem.options;
        const _optionElem = this._config.options[_optionsName].values[_origValue];
        this._value = _optionElem ? _optionElem.icon: _origValue;
        this._class = this._elem.class || '';
      }
    }
    if (this._elem.type === 'json') {
      this._class = this._elem.class || '';
    }
    if (this._elem.type === 'tags') {
      this._class = this._elem.class || '';
    }
    if (this._elem.decode) {
      this._value = decodeURI(window.atob(this._value));
    }
  }

  _sanitizeUrl(html: string) {
    return this.sanitized.bypassSecurityTrustResourceUrl(html);
  }

  truncateRows(text: string, rows: number = 2, maxchars: number = 160): string {
    let split: string[] = [];
    if (text && text.search(/\r\n|\r|\n/) !== -1) {
      split = text.split(/\r\n|\r|\n/);
      text = split.slice(0, Math.min(rows, split.length)).join('\n').trim();
    }
    if (text && (text.length > maxchars || rows < split.length)) {
      return text.substring(0, maxchars).trim() + '...';
    }
    return text;
  }

  prettyjsonPipe(value: string) {
    return JSON.stringify(value, null, 2)
    .replace(' ', '&nbsp;')
    .replace('\n', '<br/>');
  }

  onAvatarError(event: any) {
    event.target.src = './assets/images/avatar.png'
  }
}
