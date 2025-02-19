import { AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from 'projects/tools/src/lib/tools.service';
import { ConfigService } from 'projects/tools/src/lib/config.service';

import _ from 'lodash';
import * as moment from 'moment';

declare const $: any;

export interface TokenInterface {
  key: string;
  label: string;
  operator: string;
  value: string;
  data?: string;
  related?: TokenInterface;
  position?: number; // only type = multiple
  original?: TokenInterface; // only type = multiple
}

@Component({
  selector: 'ui-search-google-form',
  templateUrl: './search-google-form.component.html',
  styleUrls: [
    './search-google-form.component.scss'
  ]
})
export class SearchGoogleFormComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() showHistory: boolean = true;
  @Input() historyStore: string = '';
  @Input() showSearch: boolean = true;
  @Input() searchFields: any[] = [];
  @Input() useCondition: boolean = true;
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
  @Input() backColor: string = '#ffffff';
  @Input() hideClose: boolean = true;
  @Input() maxWidth: string = 'none';
  @Input() searchAppend: boolean = false;
  @Input() freeSearch: boolean = true;

  @Output() onSearch: EventEmitter<any> = new EventEmitter();
  @Output() onSort: EventEmitter<any> = new EventEmitter();

  _isOpen: boolean = false;
  _currentValues: any = {};

  _tokens: any[] = [];

  _placeholder: string = '';

  _history: any = {};
  _historyCount: number = 3;

  config: any;

  _notCloseForm: boolean = false;

  query: string = '';

  constructor(
    private translate: TranslateService,
    private configService: ConfigService,
    private _elementRef: ElementRef
  ) {
    this.config = this.configService.getConfiguration();
    this._historyCount = this.config.AppConfig.Search.HistoryCount || this._historyCount;
  }

  ngOnInit() {
    this._history = this._getHistory();

    // this.formGroup.valueChanges.subscribe(() => {
    //   setTimeout(() => {
    //     this._tokens = this.__createTokens(this.formGroup.value);
    //   }, 100);
    // });
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

  private _outsideClickDisable = false;
  
  @Input() set outsideClickDisable(value: boolean) { 
    setTimeout(() => {
      this._outsideClickDisable = value; 
    }, 200);
  }

  @HostListener("document:click", ['$event'])
  clickedOut(event: PointerEvent) {
    // const isStillPresentInDom = document.contains(event.target as Node);
    const isOutsideClick = !this._elementRef.nativeElement.contains(event.target);

    if (this._outsideClickDisable) { return; }
    
    if (isOutsideClick && this._isOpen && !this._notCloseForm) {
      this._isOpen = false;
      $("#form_toggle").dropdown('hide');
    }
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
      this._currentValues = this.formGroup.getRawValue();
      if (this._currentValues.q) {
        this.query = this._currentValues.q;
      }
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

  _setSearch(values: any) {
    setTimeout(() => {
      this._currentValues = values;
      this._tokens = this.__createTokens(values);
      if (this._tokens.length > 0) { this._placeholder = ''; }
      this.onSearch.emit(this._currentValues);
    }, 500);
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

  _onKeyup(event: any) {
    this.formGroup.controls['q'].setValue(this.query);
  }

  _onPaste(event: any) {
    let clipboardData = event.clipboardData;
    let pastedText = clipboardData.getData('text');
    this.formGroup.controls['q'].setValue(pastedText);
  }

  __createTokens(values: any = null) {
    const _data: any = values || this._currentValues;
    const _tokens: TokenInterface[] = [];
    Object.keys(_data).forEach(key => {
      const isDisabled = this.formGroup.get(key)?.disabled;
      if (_data[key] && _data[key] !== '' && key !== 'q' && !isDisabled) {
        const _field = this.__getField(key);
        const _operator = this.__getOperator(key);
        const _value = this.__formatValue(key, _data[key]);
        const hide = _field.options?.hide || false;
        let _token: TokenInterface | null = null;
        if (_field.type === 'multiple') {
          const _relatedField = this.__getField(_field.related);
          const _relatedOperator = this.__getOperator(_field.related);
          const _relatedValue = this.__formatValue(_field.related, _data[_field.related]);

          // console.group('multiple', _field.field)
          //   console.log('field', _field);
          //   console.log('value', _value);
          //   console.group('multiple related', _relatedField.field)
          //     console.log('field related', _relatedField);
          //     console.log('value related', _relatedValue);
          //   console.groupEnd();
          // console.groupEnd();

          if (!hide) {
            const _valuesSplit = _value.split(',');
            const _valuesTassonomieList: string[] = [];
            const _valuesCategorieList: string[] = [];
            _valuesSplit.forEach((element: any) => {
              const _split = element.split('|');
              _valuesTassonomieList.push(_split[0]);
              _valuesCategorieList.push(_split[1]);
            });

            const _labelsSplit = _relatedValue.split(',');
            const _labelsTassonomieList: string[] = [];
            const _labelsCategorieList: string[] = [];
            _labelsSplit.forEach((element: any) => {
              const _split = element.split('|');
              _labelsTassonomieList.push(_split[0]);
              _labelsCategorieList.push(_split[1]);
            });

            for (let index = 0; index < _labelsTassonomieList.length; index++) {
              const _original = { key: key, label: _field.label, operator: _operator, value: _value, data: _field };
              const _related = { key: _field.related, label: _relatedField.label, operator: _relatedOperator, value: _relatedValue, data: _relatedField._field };
              _token = { key: key, label: _labelsTassonomieList[index], operator: _operator, value: _labelsCategorieList[index], data: _field, position: index, original: _original, related: _related };
              _tokens.push(_token);
            }
          }
        } else {
          if (!hide) {
            _token = { key: key, label: _field.label, operator: _operator, value: _value, data: _field };
            _tokens.push(_token);
          }
        }
      }
      if (key === 'q') {
        this.query = _data[key];
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
    // event.stopPropagation();
    if (token.data.type === 'multiple') {
      // console.group('clearToken');
      //   console.log('token', token);
      //   console.log('token position', token.position);
      //   console.log('index', index);
      // console.groupEnd();

      const _valuesSplit = token.original.value.split(',');
      const _valuesTassonomieList: string[] = [];
      const _valuesCategorieList: string[] = [];
      _valuesSplit.forEach((element: any) => {
        const _split = element.split('|');
        _valuesTassonomieList.push(_split[0]);
        _valuesCategorieList.push(_split[1]);
      });
      _valuesTassonomieList.splice(token.position, 1);
      _valuesCategorieList.splice(token.position, 1);

      const _labelsSplit = token.related.value.split(',');
      const _labelsTassonomieList: string[] = [];
      const _labelsCategorieList: string[] = [];
      _labelsSplit.forEach((element: any) => {
        const _split = element.split('|');
        _labelsTassonomieList.push(_split[0]);
        _labelsCategorieList.push(_split[1]);
      });
      _labelsTassonomieList.splice(token.position, 1);
      _labelsCategorieList.splice(token.position, 1);

      let _newValues = [];
      let _newLabels = [];
      for (let index = 0; index < _labelsTassonomieList.length; index++) {
        _newValues.push(`${_valuesTassonomieList[index]}|${_valuesCategorieList[index]}`);
        _newLabels.push(`${_labelsTassonomieList[index]}|${_labelsCategorieList[index]}`);
      }

      this.formGroup.patchValue({
        [token.original.key]: _newValues.join(','),
        [token.related.key]: _newLabels.join(',')
      });
    } else {
      this._tokens.splice(index, 1);
      if (this._tokens.length === 0) {
        this._placeholder = this.placeholder;
      }
      this.formGroup.patchValue({
        [token.key]: ''
      });
    }
    this._onSearch();
  }

  _restoreSearch(data: any) {
    const _valuesPatch: any = {};
    Object.keys(data).forEach(key => {
      _valuesPatch[key] = data[key];
    });
    this.formGroup.patchValue(_valuesPatch);
    this._onSearch(true, false);
  }

  _openSearch(event: any = null) {
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
      this.query = '';
      // event.stopPropagation();
      this._tokens = [];
      this._currentValues = {};
      this.formGroup.reset();
      this._placeholder = this.placeholder;
    }
    this.formGroup.markAllAsTouched();
    this._onSearch();
  }

  _closeSearchDropDpwn(event: any) {
    if (!this.simple) {
      this._isOpen = false;
      $("#form_toggle").dropdown('hide');
    }
  }

  _onClickSearchInput(event: any) {
    if (!this.simple) {
      if (!this.freeSearch) {
        this._openSearch(event);
      } else {
        this._closeSearchDropDpwn(event);
      }
    }
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

  _clearPinSearch() {
    localStorage.removeItem(`History_Pin_${this.historyStore}`);
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

  _toggleFormDropdown(show: boolean) {
    if (show) {
        $("#form_toggle").removeClass('hide');
        $("#form_toggle").addClass('show');
        $("#form_toggle").focus();

    } else {
        $("#form_toggle").removeClass('show');
        $("#form_toggle").addClass('hide');
    }
  }
}
