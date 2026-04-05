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
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { MarkdownModule } from 'ngx-markdown';
import { GravatarModule } from 'ngx-gravatar';

import { HttpImgSrcPipe } from '../../pipes/http-img-src.pipe';
import { SetBackgroundImageDirective } from '../../directives/set-background-image.directive';
import { UtilsLib } from '../../utils/utils.lib';

import moment from 'moment/moment';

@Component({
    selector: 'ui-item-type',
    templateUrl: './item-type.component.html',
    styleUrls: [
        './item-type.component.scss'
    ],
    standalone: true,
    imports: [CommonModule, TranslateModule, TooltipModule, MarkdownModule, GravatarModule, HttpImgSrcPipe, SetBackgroundImageDirective]
})
export class ItemTypeComponent implements OnInit {
    @HostBinding('class.empty-space') get emptySpace(): boolean {
        return this.elem.emptySpace;
    }
    @HostBinding('class.block-space') get blockSpace(): boolean {
        return this.elem.blockSpace;
    }

    @Input() data: any = null;
    @Input() elem: any = null;
    @Input() config: any = null;

    @Output() itemClick: EventEmitter<any> = new EventEmitter();

    _value: any = null;
    _appendOriginalValue: any = null;
    _sourceData: any = null;

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
    _tagsResolved: { label: string, background: string, border: string, color: string }[] = [];
    _tooltip: string = '';
    _tooltipDelay: number = 300;
    _tooltipPlacement: any = 'top';
    _bkMode: string = 'contain';
    _logoText: string = '';
    _backColor: string = '#fafafa';
    _backColorText: string = '#000000';

    constructor(
        private readonly translate: TranslateService,
        public utilsLib: UtilsLib
    ) { }

    ngOnInit() {
        this._sourceData = this.data.source || this.data

        this._value = this.utilsLib.getObjectValue(this._sourceData, this.elem.field);
        this._logoText = this.elem.alt ? this._sourceData[this.elem.alt]?.slice(0, 2) : '';
        if ( !this._value && this.elem.default) {
            this._value = this.elem.default;
        }
        if (this.elem.tooltip) {
            const _objectValueTooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
            this._tooltip = _objectValueTooltip || this.translate.instant(this.elem.tooltip);
            this._tooltipPlacement = this.elem.tooltipPlacement || this._tooltipPlacement;
        }
        if (this.elem.type === 'date') {
            this._value = this.utilsLib.dateFormatter(this._value, this.elem.format);
        }
        if (this.elem.type === 'timeago') {
            this._value = moment(this._value).fromNow();
        }
        if (this.elem.type === 'mstime') {
            this._value = this.utilsLib.msToTime(this._value);
        }
        if (this.elem.type === 'status') {
            if (this.config.options) {
                const _origValue = this._value;
                const _optionsName = this.elem.options;
                const _optionElem = this.config.options[_optionsName] ? this.config.options[_optionsName].values[_origValue] : null;
                this._value = this._value ? (_optionElem ? _optionElem.label : this._value) : 'undefined';
                this._label = (this.config.options.statusLabel) ? this.config.options.statusLabel : 'Status';
                this._background = (this.config.options.status?.[_origValue]) ? this.config.options.status[_origValue].background : '#1f1f1f';
                this._border = (this.config.options.status?.[_origValue]) ? this.config.options.status[_origValue].border : '#1f1f1f';
                this._color = (this.config.options.status?.[_origValue]) ? this.config.options.status[_origValue].color : '#fff';
                this._class = this.config.options.statusSmall ? 'status-label-sm' : '';
            }
        }
        if (this.elem.type === 'label') {
            if (this.config.options) {
                const _origValue = this._value;
                const _optionsName = this.elem.options;
                const _optionElem = this.config.options[_optionsName] ? this.config.options[_optionsName].values[_origValue] : null;
                if (_origValue) {
                    this._label = (this.config.options[_optionsName].label) ? this.config.options[_optionsName].label : _optionsName;
                    this._value = this._value ? (_optionElem ? _optionElem.label : this._value) : _optionElem.label;
                    this._background = (this.config.options[_optionsName] && _optionElem) ? _optionElem.background : '#1f1f1f';
                    this._border = (this.config.options[_optionsName] && _optionElem) ? _optionElem.border : '#1f1f1f';
                    this._color = (this.config.options[_optionsName] && _optionElem) ? _optionElem.color : '#fff';
                    if (!((this.config.options[_optionsName] && _optionElem)) && this.config.options[_optionsName].values['default']) {
                        this._background = this.config.options[_optionsName].values['default'].background;
                        this._border = this.config.options[_optionsName].values['default'].border;
                        this._color = this.config.options[_optionsName].values['default'].color;
                    }
                    this._class = this.config.options[_optionsName].small ? 'status-label-sm' : '';
                }
            }
        }
        if (this.elem.type === 'tag') {
            this._tooltip = this.elem.tooltip ? this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip) : '';
            this._class = 'badge badge-pill';
            this._class += this.elem.class ? ' ' + this.elem.class : '';
            this._showBadged = (this.elem.badged === undefined) ? true : this.elem.badged;
            if (this.config.options) {
                const _origValue = this._value;
                const _optionsName = this.elem.options;
                if (!this.config.options[_optionsName]) {
                    return;
                }
                let _optionValue = this.config.options[_optionsName].values[_origValue];
                if (!_optionValue) {
                    _optionValue = this.config.options[_optionsName].values['default'];
                    if (!_optionValue) {
                        return;
                    }
                    _optionValue.label = this._value;
                }
                this._value = this._value ? (_optionValue ? _optionValue.label : this._value) : _optionValue.label;
                this._background = (_optionValue) ? _optionValue.background : '#1f1f1f';
                this._border = (_optionValue) ? _optionValue.border : '#1f1f1f';
                this._color = (_optionValue) ? _optionValue.color : '#fff';
                this._class += this.config.options[_optionsName].small ? ' gl-badge-sm' : ' gl-badge';
            }
        }
        if (this.elem.type === 'labelI18n') {
            const _origValue = this._value;
            if (this.config.options) {
                const _optionsName = this.elem.options;
                const _optionElem = this.config.options[_optionsName] ? this.config.options[_optionsName].values[_origValue] : null;
                this._value = this._value ? (_optionElem ? _optionElem.label : this._value) : _optionElem.label;
            }
            if (this.elem.appendValue) {
                this._appendOriginalValue = this.utilsLib.getObjectValue(this._sourceData, this.elem.appendValue);
            }
        }
        if (this.elem.type === 'image' && this.elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
        }
        if (this.elem.type === 'avatar' && this.elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
        }
        if (this.elem.type === 'avatar-image' && this.elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
        }
        if (this.elem.type === 'gravatar-image' && this.elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
        }
        if (this.elem.type === 'text' && this.elem.truncate) {
            this._value = this.truncateRows(this._value, 2, this.elem.truncate)
        }
        if (this.elem.type === 'mstime' && this.elem.tooltip) {
            this._tooltip = this.utilsLib.msToTime(this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip));
        }
        if (this.elem.type === 'icon') {
            if (this.config.options) {
                const _origValue = this._value;
                const _optionsName = this.elem.options;
                const _optionElem = _optionsName ? this.config.options[_optionsName].values[_origValue] : null;
                this._value = _optionElem ? _optionElem.icon: (this.elem.icon || _origValue);
                this._class = this.elem.class || '';
                if (_optionElem?.tooltip && !this.elem.hideTooltip) {
                    this._tooltip = this.translate.instant(_optionElem.tooltip);
                    this._tooltipPlacement = _optionElem.tooltipPlacement || this._tooltipPlacement;
                }
                if (_optionElem?.tooltip2 && !this.elem.hideTooltip) {
                    const _tooltip2 = this.translate.instant(_optionElem.tooltip2);
                    this._tooltip = `${this._tooltip}<br><br>${_tooltip2}`;
                }
            }
        }
        if (this.elem.type === 'tags') {
            this._class = this.elem.class || '';
            if (Array.isArray(this._value) && this.config?.options && this.elem.options) {
                const _optionsName = this.elem.options;
                const _optionsConfig = this.config.options[_optionsName];
                if (_optionsConfig) {
                    this._tagsResolved = this._value.map((tag: string) => {
                        const opt = _optionsConfig.values[tag] || _optionsConfig.values['default'];
                        return {
                            label: opt ? this.translate.instant(opt.label) : tag,
                            background: opt ? opt.background : '#e9ecef',
                            border: opt ? opt.border : '#dee2e6',
                            color: opt ? opt.color : '#000000'
                        };
                    });
                }
            }
        }
        if (this.elem.type === 'simplelabel') {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this.elem.tooltip);
            this._class = this.elem.class || '';
        }
        this._bkMode = this.elem.mode || 'contain';

        if (this.elem.showLabel) {
            const _label = this.translate.instant(this.elem.label);
            this._value = `${_label}: ${this._value}`;
        }
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

    onAvatarError(event: any) {
        event.target.src = './assets/images/avatar.png'
    }
}
