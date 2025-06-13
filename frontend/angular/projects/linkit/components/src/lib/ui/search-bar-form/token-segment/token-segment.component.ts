import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { UtilsLib } from '../../../utils/utils.lib';

@Component({
    selector: 'ui-token-segment',
    templateUrl: './token-segment.component.html',
    styleUrls: [
        './token-segment.component.scss'
    ],
    standalone: false
})
export class TokenSegmentComponent implements OnInit {

  @Input() token: any = null;
  @Input() index: any = null;
  @Input() simple: boolean = false;
  @Input() useCondition: boolean = true;

  @Output() onAction: EventEmitter<any> = new EventEmitter();
  @Output() onRemove: EventEmitter<any> = new EventEmitter();

  config: any;

  data$!: Observable<any>;
  field: string = '';

  api_url: string = '';

  constructor(
    private http: HttpClient,
    private configService: ConfigService,
    public utilsLib: UtilsLib
  ) {
    this.config = this.configService.getConfiguration();
    this.api_url = this.config.AppConfig.GOVAPI.HOST || '';
  }

  ngOnInit(): void {
    this.data$ = of({ nome: this.token.value });
    let _endPoint = '';
    let _param1 = '';
    let _param2 = '';
    let _split = [];

    switch (this.token.data.type) {
      case 'multiple':
        break;

      case 'related':
        _split = this.token.value.split('|');
        _param1 = _split[0];
        _param2 = _split[1];
        _endPoint = `${this.api_url}/${this.token.data.params.resource}/${_param1}/${this.token.data.params.path}/${_param2}`;
        this._getData(`${_endPoint}`);  
        break;
    
      default:
        if (this.token.data && this.token.data.params && this.token.data.params.resource) {
          this.field = this.token.data.params.field;
          const _resource = this.token.data.params.resource;
          const _path = this.token.data.params.path;
          const _urlParam = this.token.data.params.urlParam;
          const _id = this.token.value;
          _endPoint = _path ? `${this.api_url}/${_resource}${_path}${_id}` : `${this.api_url}/${_resource}`;
          if (Array.isArray(_id)) {
            this._getDataJoin(_endPoint, _id);
          } else {
            _endPoint = _urlParam ? `${this.api_url}/${_resource}${_urlParam}${_id}` : `${_endPoint}/${_id}`;
            this._getData(`${_endPoint}`);
          }
        }
        if (this.token.data && this.token.data.data && Array.isArray(this.token.value)) {
          this._getDataFromData(this.token.value, this.token.data.data);
        }
        break;
    }
  }

  _onAction(event: any) {
    event.stopPropagation();
    this.onAction.emit(this.token);
  }
  
  _removeToken(event: any) {
    event.stopPropagation();
    this.onRemove.emit({ token: this.token, index: this.index });
  }

  _getDataFromData(arr: any[], data: any) {
    const _arrResult: any[] = [];
    
    arr.forEach((index: number) => {
      const _index = data.findIndex((item: any) => item.value === index);
      if (_index !== -1) {
        _arrResult.push(data[_index].label);
      }
    });

    this.data$ = of({ nome: _arrResult.join(', ') });
  }

  _getData(endPoint: string) {
    this.data$ = this.http.get(`${endPoint}`, {})
      .pipe(
        map((data: any) => (Array.isArray(data.content)) ? data.content[0] : data )
      );
  }

  _getDataJoin(endPoint: string, data: any) {
    let _result = '';
    const reqs: Observable<any>[] = [];
    
    data.forEach((item: any) => {
      reqs.push(this.http.get(`${endPoint}/${item}`, {}));
    });

    forkJoin(reqs).subscribe(
      (results: Array<any>) => {
        const _resMap = results.map((item) => { return (item.nome || item); });
        _result = _resMap.join(', ');
        this.data$ = of({ nome: _result });
      },
      (error: any) => {
        console.log('_getDataJoin forkJoin', error);
      }
    );
  }

  _getObjectValue(data: any, elem: string) {
    const _fields: RegExpMatchArray | null = elem.match(/\{(\w+)\}/g);
    if (!_fields) {
      return this.utilsLib.getObjectValue(data, elem);
    } else {
      const _values: any[] = [];
      _fields.forEach(element => {
        const _field = element.slice(1,-1);
        const _value = this.utilsLib.getObjectValue(data, _field);
        _values.push({ label: element, value: _value });
      });
      let _result: string = elem;
      _values.forEach(element => {
        _result = _result.replace(element.label, element.value);
      });
      return _result;
    }
  }

  _getObjectValueMapper = (data: any, elem: string): string => {
    if (!elem) { return data.nome }
    const _fields: RegExpMatchArray | null = elem.match(/\{(\w+)\}/g);
    if (!_fields) {
      return this.utilsLib.getObjectValue(data, elem);
    } else {
      const _values: any[] = [];
      _fields.forEach(element => {
        const _field = element.slice(1,-1);
        const _value = this.utilsLib.getObjectValue(data, _field);
        _values.push({ label: element, value: _value });
      });
      let _result: string = elem;
      _values.forEach(element => {
        _result = _result.replace(element.label, element.value);
      });
      return _result;
    }
  }
}

import { Pipe, PipeTransform } from '@angular/core';
import { ConfigService } from '../../../services';

type Mapper<T, G> = (item: T, ...args: any[]) => G;

@Pipe({
    name: `mapper`,
    standalone: false
})
export class MapperPipe implements PipeTransform {
  transform<T, G>(value: T, mapper: Mapper<T, G>, ...args: any[]): G {
    return mapper(value, ...args);
  }
}
