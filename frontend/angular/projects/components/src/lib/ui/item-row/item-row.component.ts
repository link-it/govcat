import { AfterViewInit, Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { UtilsLib } from '../../utils/utils.lib';

@Component({
  selector: 'ui-item-row',
  templateUrl: './item-row.component.html',
  styleUrls: [
    './item-row.component.scss'
  ]
})
export class ItemRowComponent implements OnInit, AfterViewInit {
  @HostBinding('class.notify') get notifyClass(): boolean {
    return this.notify;
  }

  @Input('data') _data: any = null;
  @Input('config') _config: any = null;
  @Input() configRow: string = 'itemRow';
  @Input() actionDisabled: boolean = false;
  @Input() notify: boolean = false;
  @Input() hoverFeedback: boolean = true;
  @Input() hasLink: boolean = false;
  @Input() hasAction: boolean = false;
  @Input() iconAction: string = 'download';
  @Input() actionText: string = 'download';
  @Input() actionTooltip: string = 'download';
  @Input() rowClick: boolean = false;
  @Input() hostBackground: string = '#ffffff';
  @Input() isAnonymous: boolean = false;

  @Output() itemClick: EventEmitter<any> = new EventEmitter();
  @Output() actionClick: EventEmitter<any> = new EventEmitter();

  _dummyText: string = 'DUMMY TEXT';

  _itemRowConfig: any = null;

  _tooltipBox1: string = '';
  _tooltipPlacementBox1: any = 'top';
  _tooltipBox2: string = '';
  _tooltipPlacementBox2: any = 'top';

  _tooltipDelay: number = 300;

  constructor(
    private element: ElementRef,
    private sanitized: DomSanitizer,
    private translate: TranslateService,
    private utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    document.documentElement.style.setProperty('--item-row-background-color', this.hostBackground);

    this._itemRowConfig = this._config[this.configRow] || this._config.itemRow || this._config.simpleItem;
    if (this._itemRowConfig.boxStatus1) {
      this._tooltipBox1 = this._setTooltip(this._itemRowConfig.boxStatus1);
      this._tooltipPlacementBox1 = this._setTooltipPlacement(this._itemRowConfig.boxStatus1);
    }
    if (this._itemRowConfig.boxStatus2) {
      this._tooltipBox2 = this._setTooltip(this._itemRowConfig.boxStatus2);
      this._tooltipPlacementBox2 = this._setTooltipPlacement(this._itemRowConfig.boxStatus2);
    }
  }

  ngAfterViewInit(): void {
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html);
  }

  __itemClick(event: any, activeItem: any) {
    if (!this.rowClick) {
      this.itemClick.emit(this._data);
    }
  }

  __itemClickRow(event: any, activeItem: any) {
    if (this.rowClick) {
      this.itemClick.emit(this._data);
    }
  }

  __actionlick(event: any) {
    event.stopImmediatePropagation();
    event.preventDefault();
    this.actionClick.emit(this._data);
  }

  _showEmpty(field: any) {
    const _value = this.utilsLib.getObjectValue(this._data.source || this._data, field.field);
    return (!_value && field.hideEmpty) ? false : true;
  }

  _hideAnonymous(field: any) {
    return this.isAnonymous ? field.hideAnonymous || false : false;
  }

  _getBackground(boxOptions: any) {
    let _background = '';
    if (typeof boxOptions.background === 'object') {
      const _value = this.utilsLib.getObjectValue(this._data.source || this._data, boxOptions.background.field);
      const _optionsName = boxOptions.background.options;
      _background = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_value]) ? this._config.options[_optionsName].values[_value].background : '#1f1f1f';
      const _color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_value]) ? this._config.options[_optionsName].values[_value].color : '#fff';
    } else {
      _background = boxOptions.background;
    }
    return _background;
  }

  _getColor(boxOptions: any) {
    let _color = '';
    if (typeof boxOptions.background === 'object') {
      const _value = this.utilsLib.getObjectValue(this._data.source || this._data, boxOptions.background.field);
      const _optionsName = boxOptions.background.options;
      _color = (this._config.options[_optionsName] && this._config.options[_optionsName].values[_value]) ? this._config.options[_optionsName].values[_value].color : '#fff';
    } else {
      _color = boxOptions.color;
    }
    return _color;
  }

  _setTooltip(boxOptions: any) {
    let _tooltip = '';
    let _tooltip2 = '';
    if (typeof boxOptions.tooltip === 'object') {
      let _value = this.utilsLib.getObjectValue(this._data.source || this._data, boxOptions.tooltip.field);
      const _origValue = _value;

      const _optionsName = boxOptions.tooltip.options;
      const _optionElem = this._config.options[_optionsName] ? this._config.options[_optionsName].values[_origValue] : null;
      _value = _optionElem ? _optionElem.icon: _origValue;

      if (boxOptions.tooltip.type === 'mstime') {
        _value = this.utilsLib.msToTime(this.utilsLib.getObjectValue(this._data.source || this._data, boxOptions.tooltip.field));
      }

      let _label = this.translate.instant(boxOptions.tooltip.label);
      if (_optionElem?.tooltip) {
        _tooltip = this.translate.instant(_optionElem.tooltip);
        _label = _tooltip;
      }
      if (_optionElem?.tooltip2) {
        _tooltip2 = this.translate.instant(_optionElem.tooltip2);
        _value = _tooltip2;
      }

      _tooltip = `${_label}<br><br>${_value}`;
    } else {
      _tooltip = this.translate.instant(boxOptions.tooltip);
    }
    return _tooltip;
  }

  _setTooltipPlacement(boxOptions: any) {
    let _tooltipPlacement = '';
    if (typeof boxOptions.tooltip === 'object') {
      _tooltipPlacement = boxOptions.tooltip.placement || 'top';
    } else {
      _tooltipPlacement = 'top';
    }
    return _tooltipPlacement;
  }
}
