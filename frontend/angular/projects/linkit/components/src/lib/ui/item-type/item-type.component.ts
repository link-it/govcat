import { Component, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { UtilsLib } from '../../utils/utils.lib';

import moment from 'moment/moment';

@Component({
    selector: 'ui-item-type',
    templateUrl: './item-type.component.html',
    styleUrls: [
        './item-type.component.scss'
    ],
    standalone: false
})
export class ItemTypeComponent implements OnInit {
    @HostBinding('class.empty-space') get emptySpace(): boolean {
        return this._elem.emptySpace;
    }
    @HostBinding('class.block-space') get blockSpace(): boolean {
        return this._elem.blockSpace;
    }

    @Input('data') _data: any = null;
    @Input('elem') _elem: any = null;
    @Input('config') _config: any = null;

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
    _tooltip: string = '';
    _tooltipDelay: number = 300;
    _tooltipPlacement: any = 'top';
    _bkMode: string = 'contain';
    _logoText: string = '';
    _backColor: string = '#fafafa';
    _backColorText: string = '#000000';

    constructor(
        private sanitized: DomSanitizer,
        private translate: TranslateService,
        public utilsLib: UtilsLib
    ) { }

    ngOnInit() {
        this._sourceData = this._data.source || this._data

        this._value = this.utilsLib.getObjectValue(this._sourceData, this._elem.field);
        this._logoText = this._elem.alt ? this._sourceData[this._elem.alt]?.slice(0, 2) : '';
        if ( !this._value && this._elem.default) {
            this._value = this._elem.default;
        }
        if (this._elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
            if (!this._tooltip) {
                this._tooltip = this.translate.instant(this._elem.tooltip);
            }
            this._tooltipPlacement = this._elem.tooltipPlacement || this._tooltipPlacement;
        }
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
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
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
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
            if (this._config.options) {
                const _origValue = this._value;
                const _optionsName = this._elem.options;
                this._label = (this._config.options[_optionsName].label) ? this._config.options[_optionsName].label : _optionsName;
                this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : this._config.options[_optionsName].values[_origValue].label;
                this._background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].background : '#1f1f1f';
                this._border = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].border : '#1f1f1f';
                this._color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].color : '#fff';
                if (!((this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue])) && this._config.options[_optionsName].values['default']) {
                    this._background = this._config.options[_optionsName].values['default'].background;
                    this._border = this._config.options[_optionsName].values['default'].border;
                    this._color = this._config.options[_optionsName].values['default'].color;
                }
                this._class = this._config.options[_optionsName].small ? 'status-label-sm' : '';
            }
        }
        if (this._elem.type === 'tag') {
            // this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
            this._class = 'badge badge-pill';
            this._class += this._elem.class ? ' ' + this._elem.class : '';
            this._showBadged = (this._elem.badged !== undefined) ? this._elem.badged : true;
            if (this._config.options) {
                const _origValue = this._value;
                const _optionsName = this._elem.options;
                if (!this._config.options[_optionsName]) {
                    return;
                }
                this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : this._config.options[_optionsName].values[_origValue].label;
                this._background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].background : '#1f1f1f';
                this._border = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].border : '#1f1f1f';
                this._color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_origValue]) ? this._config.options[_optionsName].values[_origValue].color : '#fff';
                this._class += this._config.options[_optionsName].small ? ' gl-badge-sm' : ' gl-badge';
            }
        }
        if (this._elem.type === 'labelI18n') {
            const _origValue = this._value;
            if (this._config.options) {
                const _optionsName = this._elem.options;
                this._value = this._value ? (this._config.options[_optionsName].values[_origValue] ? this._config.options[_optionsName].values[_origValue].label : this._value) : this._config.options[_optionsName].values[_origValue].label;
            }
            if (this._elem.appendValue) {
                this._appendOriginalValue = this.utilsLib.getObjectValue(this._sourceData, this._elem.appendValue);
            }
        }
        if (this._elem.type === 'image' && this._elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
        }
        if (this._elem.type === 'avatar' && this._elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
        }
        if (this._elem.type === 'avatar-image' && this._elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
        }
        if (this._elem.type === 'gravatar-image' && this._elem.tooltip) {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
        }
        if (this._elem.type === 'text' && this._elem.truncate) {
            this._value = this.truncateRows(this._value, 2, this._elem.truncate)
        }
        if (this._elem.type === 'mstime' && this._elem.tooltip) {
            this._tooltip = this.utilsLib.msToTime(this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip));
        }
        if (this._elem.type === 'icon') {
            if (this._config.options) {
                const _origValue = this._value;
                const _optionsName = this._elem.options;
                const _optionElem = _optionsName ? this._config.options[_optionsName].values[_origValue] : null;
                this._value = _optionElem ? _optionElem.icon: (this._elem.icon || _origValue);
                this._class = this._elem.class || '';
                if (_optionElem?.tooltip && !this._elem.hideTooltip) {
                    this._tooltip = this.translate.instant(_optionElem.tooltip);
                    this._tooltipPlacement = _optionElem.tooltipPlacement || this._tooltipPlacement;
                }
                if (_optionElem?.tooltip2 && !this._elem.hideTooltip) {
                    const _tooltip2 = this.translate.instant(_optionElem.tooltip2);
                    this._tooltip = `${this._tooltip}<br><br>${_tooltip2}`;
                }
            }
        }
        if (this._elem.type === 'tags') {
            this._class = this._elem.class || '';
        }
        if (this._elem.type === 'simplelabel') {
            this._tooltip = this.utilsLib.getObjectValue(this._sourceData, this._elem.tooltip);
            this._class = this._elem.class || '';
        }
        this._bkMode = this._elem.mode || 'contain';

        if (this._elem.showLabel) {
            const _label = this.translate.instant(this._elem.label);
            this._value = `${_label}: ${this._value || '-'}`;
        }
    }

    ngAfterViewInit(): void {
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
