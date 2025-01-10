import { AfterViewInit, Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from 'projects/tools/src/lib/tools.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';

import _ from 'lodash';
import * as moment from 'moment';

declare const $: any;

@Component({
  selector: 'ui-search-bar-form',
  templateUrl: './search-bar-form.component.html',
  styleUrls: [
    './search-bar-form.component.scss'
  ]
})
export class SearchBarFormComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() showHistory: boolean = true;
  @Input() historyStore: string = '';
  @Input() showSearch: boolean = true;
  @Input() searchFields: any[] = [];
  @Input() showSorting: boolean = true;
  @Input() showDataRange: boolean = false;
  @Input() sortField: string = '';
  @Input() sortDirection: string = 'asc';
  @Input() sortFields: any[] = [];
  @Input() classBlock: string = '';
  @Input() placeholder: string = 'Search or filter results...';
  @Input() formGroup: UntypedFormGroup = new UntypedFormGroup({});
  @Input() autoPin: boolean = false;
  @Input() simple: boolean = false;
  @Input() backColor: string = '#fafafa';
  @Input() hideClose: boolean = false;
  @Input() maxWidth: string = 'none';

  @Output() onSearch: EventEmitter<any> = new EventEmitter();
  @Output() onSort: EventEmitter<any> = new EventEmitter();

  _isOpen: boolean = false;
  _currentValues: any = {};

  _tokens: any[] = [];

  _placeholder: string = '';

  _history: any = {};
  _historyCount: number = 3;

  config: any;

  _clickInside: boolean = false;
  _notCloseForm: boolean = false;

  query: string = '';

  constructor(
    private domSanitizer: DomSanitizer,
    private translate: TranslateService,
    private configService: ConfigService
  ) {
    this.config = this.configService.getConfiguration();
    this._historyCount = this.config.AppConfig.Search.HistoryCount || this._historyCount;
  }

  ngOnInit() {
    this._history = this._getHistory();

    this.formGroup.valueChanges.subscribe(() => {
      setTimeout(() => {
        this._tokens = this.__createTokens(this.formGroup.value);
      }, 100);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.placeholder) {
      this.placeholder = changes.placeholder.currentValue;
      this._placeholder = this.placeholder;
    }
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.__restoreLastSearch();
    }, 100);
  }

  @HostListener("click")
  clicked() {
    this._clickInside = true;
  }
  @HostListener("document:click")
  clickedOut() {
    if (!this._clickInside) {
      if (this._isOpen && !this._notCloseForm) {
        this._isOpen = false;
        $("#form_toggle").dropdown('hide');
        // this._onSearch();
      }
    }
    this._clickInside = false;
  }

  setNotCloseForm(value: boolean) {
    this._notCloseForm = value;
  }

  _selectSort(item: any) {
    this.sortField = item.field;
    this.onSort.emit({ sortField: this.sortField, sortBy: this.sortDirection });
  }

  _toggleSortBy() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.onSort.emit({ sortField: this.sortField, sortBy: this.sortDirection });
  }

  _isAscending() {
    return this.sortDirection === 'asc';
  }

  _getSortLabel(field: string) {
    return this.sortFields.find(item => item.field === field).label;
  }

  _onSearch(close: boolean = true, save: boolean = true) {
    if (this.simple) {
      this.onSearch.emit({ q: this.query });
    } else {
      // Get Form data
      const _oldValues = this._currentValues;
      this._currentValues = this.formGroup.value;
      this._tokens = this.__createTokens();
      if (_oldValues !== this._currentValues) {
        if (!this.__isEmptyValues(this._currentValues) && save) {
          this._addHistory(this._currentValues);
          this._history = this._getHistory();
        }
        if (this.autoPin) {
          this._pinLastSearch();
        }
      }
      this.onSearch.emit(this._currentValues);
      if (this._tokens.length > 0) { this._placeholder = ''; }
      if (this._isOpen && close) {
        this._closeSearchDropDpwn(null);
      }
    }
  }

  __isEmptyValues(values: any) {
    let _isEmpty = true;
    Object.keys(values).forEach(key => {
      if (values[key] !== '' && values[key] !== null) {
        _isEmpty = false;
        return false;
      }
      return true;
    });
    return _isEmpty;
  }

  __createTokens(values: any = null) {
    const _data: any = values || this._currentValues;
    const _tokens: any = [];
    Object.keys(_data).forEach(key => {
      if (_data[key] && _data[key] !== '') {
        const _field = this.__getField(key);
        const _operator = this.__getOperator(key);
        const _value = this.__formatValue(key, _data[key]);
        _tokens.push({ key: key, label: _field.label, operator: _operator, value: _value });
      }
    });
    return _tokens;
  }

  __getField(key: string) {
    let _field = this.searchFields.find((item) => item.field === key);
    if (!_field) {
      // const _spiltKey: string[] = [];
      // key.split('.').map((item) => { _spiltKey.push(item[0].toUpperCase() + item.slice(1)) });
      // const _key = _spiltKey.join('');
      _field = {
        field: key,
        label: `APP.LABEL.${key}`,
        type: 'string',
        condition: 'equal'
      };
    }
    _field.label = this.translate.instant(_field.label);
    return _field;
  }

  __getOperator(key: string) {
    const _field = this.__getField(key);
    let _operator = '⊂';
    switch (_field.condition) {
      case 'like':
        _operator = '⊂';
        break;
      case 'equal':
        _operator = '=';
        break;
      case 'gt':
        _operator = '>';
        break;
      case 'gte':
        _operator = '>=';
        break;
      case 'lt':
        _operator = '<';
        break;
      case 'lte':
        _operator = '<=';
        break;
      default:
        break;
    }
    return _operator;
  }

  __formatValue(key: string, value: any) {
    const _field = this.__getField(key);
    let _value = value;
    if (_field.callBack) {
      _value = _field.callBack(_value);
    } else {
      switch (_field.type) {
        case 'enum':
          _value = this.translate.instant(_field.enumValues[value]);
          break;
        case 'boolean':
          _value = value ? this.translate.instant(_field.booleanValues[0]) : this.translate.instant(_field.booleanValues[1]);
          break;
        case 'date':
          _value = moment(value.valueOf()).format(_field.format);
          break;
        case 'object':
          _value = value[_field.data.label];
          break;
        default:
          break;
      }
    }
    return _value;
  }

  _clearToken(event: any, token: any, index: number) {
    event.stopPropagation();
    this._tokens.splice(index, 1);
    if (this._tokens.length === 0) {
      this._placeholder = this.placeholder;
    }
    this.formGroup.patchValue({
      [token.key]: ''
    });
    this._onSearch();
  }

  _restoreSearch(search: any) {
    const _valuesPatch: any = {};
    Object.keys(search).forEach(key => {
      _valuesPatch[key] = search[key];
    });
    this.formGroup.patchValue(_valuesPatch);
    this._onSearch(true, false);
  }

  _openSearch(event: any) {
    if (!this.simple) {
      if (this._isOpen) {
        this._isOpen = false;
        $("#form_toggle").dropdown('hide');
      } else {
        this._isOpen = true;
        $("#form_toggle").dropdown('show');
      }
    }
  }

  _clearSearch(event: any) {
    if (this.simple) {
      this.query = '';
    } else {
      event.stopPropagation();
      this._tokens = [];
      this._currentValues = {};
      this.formGroup.reset();
      this._placeholder = this.placeholder;
    }
    this._onSearch();
  }

  clearSearch() {
    if (this.simple) {
      this.query = '';
    } else {
      this._tokens = [];
      this._currentValues = {};
      this.formGroup.reset();
      this._placeholder = this.placeholder;
    }
  }

  _closeSearchDropDpwn(event: any) {
    this._isOpen = false;
    $("#form_toggle").dropdown('hide');
  }

  // History

  _getHistory(): any {
    const _history: any = localStorage.getItem(`History_${this.historyStore}`);
    if (_history && _history !== 'null') {
      return Tools.DecodeDataOptions(_history);
    } else {
      return this.__setDefaultHistory();
    }
  }

  _getHistorytokens(values: any): any {
    return this.__createTokens(values);
  }

  _addHistory(data: any): any {
    let _history: any[] = this._getHistory();
    if (_history) {
      _history.push(data);
    } else {
      _history = [data];
    }
    if (_history.length > this._historyCount) {
      _history = _history.slice(_history.length - this._historyCount);
    }
    return this.__saveHistory(_history);
  }

  _clearHistory() {
    localStorage.removeItem(`History_${this.historyStore}`);
    this._history = this.__setDefaultHistory();
  }

  __setDefaultHistory(): any {
    this.__saveHistory([]);
    return this._getHistory();
  }

  __saveHistory(data: any): any {
    const lStorage = Tools.EncodeDataOptions(data);
    localStorage.setItem(`History_${this.historyStore}`, lStorage);
    return lStorage;
  }

  _isPinned() {
    const _pin: any = localStorage.getItem(`History_Pin_${this.historyStore}`);
    if (_pin && _pin !== 'null') {
      return true;
    } else {
      return false;
    }
  }

  _pinLastSearch() {
    if (!this.__isEmptyValues(this._currentValues)) {
      const lStorage = Tools.EncodeDataOptions(this._currentValues);
      localStorage.setItem(`History_Pin_${this.historyStore}`, lStorage);
    } else {
      if (this.autoPin) {
        localStorage.removeItem(`History_Pin_${this.historyStore}`);
      }
    }
  }

  __restoreLastSearch() {
    const _pinned: any = localStorage.getItem(`History_Pin_${this.historyStore}`);
    if (_pinned && _pinned !== 'null') {
      this._restoreSearch(Tools.DecodeDataOptions(_pinned));
    }
    if (!this.autoPin) {
      localStorage.removeItem(`History_Pin_${this.historyStore}`);
    }
  }
}
