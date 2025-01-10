import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { UtilsLib } from '../../utils/utils.lib';

@Component({
  selector: 'ui-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: [
    './data-view.component.scss'
  ]
})
export class DataViewComponent implements OnInit {

  @Input('data') _data: any = null;
  @Input('config') _config: any = null;
  @Input('columns') _columns: number = 6;
  @Input('details') _details: any = null;

  @Output() downloadClick: EventEmitter<any> = new EventEmitter();

  _detailsConfig: any = null;

  _accordionOpen: boolean = false;

  constructor(
    private sanitized: DomSanitizer,
    public utilsLib: UtilsLib
  ) { }

  ngOnInit() {
    this._detailsConfig = this._details || this._config.details;
  }

  __downloadClick(item: any) {
    this.downloadClick.emit({ item });
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html)
  }

  _showEmpty(field: any) {
    const _value = this.utilsLib.getObjectValue(this._data, field.field);
    return (!_value && field.hideEmpty) ? false : true;
  }

  onShowHideAccordion() {
    this._accordionOpen = !this._accordionOpen;
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
}
