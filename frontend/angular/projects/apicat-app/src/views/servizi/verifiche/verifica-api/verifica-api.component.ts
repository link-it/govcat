import { Component, HostListener, Input, SimpleChanges } from '@angular/core';

import { UtilService } from '@app/services/utils.service';
import { OpenAPIService } from '@app/services/openAPI.service';

import _ from 'lodash';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ViewType } from '../verifiche.component';

@Component({
  selector: 'ui-verifica-api',
  styleUrls: ['./verifica-api.component.scss'],
  templateUrl: './verifica-api.component.html',
  standalone: false
})
export class VerificaApiComponent {

  @Input() environmentId: string = 'collaudo'; // collaudo - produzione
  @Input() verifica: string = 'erogazioni'; // erogazioni - fruizioni - applicativi - soggetti
  @Input() provider: string = '';
  @Input() pdnd: boolean = true;
  @Input() type: string = 'certificati'; // certificati - backend
  @Input() api: any = null;
  @Input() service: any = null;
  @Input() config: any = null;
  @Input() showInfo: boolean = true;
  @Input() icon: string = '';
  @Input() iconSvg: string = '';
  @Input() title: string = 'APP.TITLE.Certificati';
  @Input() reduced: boolean = false;
  @Input() compact: boolean = false;
  @Input() adhesions: any[] = [];
  @Input() viewType: ViewType = ViewType.All;
  @Input() path: string = '';
  @Input() period: any = {};

  ViewType = ViewType;

  uid: string = Math.random().toString(36).slice(2, 7);

  _profilo: string = '';

  _stato: string = 'scaduti'; // scaduti - in-scadenza | stato

  _loading: boolean = true;

  _esiti: any[] = [
    { value: 'valido', label: 'APP.VERIFY.ESITO.Valido', color: 'success', colorHex: '#a6d75b' },
    { value: 'in_scadenza', label: 'APP.VERIFY.ESITO.InScadenza', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'scaduto', label: 'APP.VERIFY.ESITO.Scaduto', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'http_error', label: 'APP.VERIFY.ESITO.HttpError', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'ok', label: 'APP.VERIFY.ESITO.Ok', color: 'success', colorHex: '#a6d75b' },
    { value: 'warning', label: 'APP.VERIFY.ESITO.Warning', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'errore', label: 'APP.VERIFY.ESITO.Errore', color: 'danger', colorHex: '#dd2b0e' },
  ];

  _result: any = null;
  _showVesaDetails: boolean = false;
  _showDetails: boolean = false;

  constructor(
    private utilService: UtilService,
    private apiService: OpenAPIService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.environmentId) {
      this.environmentId = changes.environmentId.currentValue;
      this._showDetails = false;
    }
    if (changes.pdnd) {
      this._profilo = changes.pdnd.currentValue ? 'pdnd' : 'modi';
    }
    if (changes.type) {
      this._stato = (changes.type.currentValue === 'backend') ? 'stato' : 'scaduti';
    }
    if (changes.viewType) {
      this.viewType = changes.viewType.currentValue;
      this._showVesaDetails = (this.viewType !== ViewType.All);
      this._showDetails = (this.viewType !== ViewType.All);
    }

    if (this.adhesions.length > 0) {
      this._loadAllErogazioni();
    } else {
      this._loadEsito();
    }
  }

  _loadEsito() {
    let _validCall: boolean = true;

    this._loading = true;
    this._result = null;

    console.group('loadEsito');
    console.log('environmentId', this.environmentId);
    console.log('verifica', this.verifica);
    console.log('provider', this.provider);
    console.log('viewType', this.viewType);
    console.groupEnd();

    let _provider = '';
    if (this.verifica === 'fruizioni') {
      if (this.provider) {
        _provider = `/${this.provider}`;
        _validCall = true;
      } else {
        _validCall = false;
      }
    }
    if (!_validCall) { return; }

    let _aux: any;
    let _path: string = '';
    switch (this.viewType) {
      case ViewType.All:
      case ViewType.Certificati:
      case ViewType.Connettivita:
        break;

      case ViewType.Violazioni:
        _aux = { params: this.utilService._queryToHttpParams(this.period) };  
        this._stato = 'stato';
        this.type = 'rate-limiting';
        break;
        
      case ViewType.EventiConnection:
        _aux = { params: this.utilService._queryToHttpParams(this.period) };  
        this._stato = 'stato';
        this.type = 'connection-timeout';
        break;

      case ViewType.EventiRead:
        _aux = { params: this.utilService._queryToHttpParams(this.period) };  
        this._stato = 'stato';
        this.type = 'read-timeout';
        break;
    
      default:
        console.log('Error viewType', this.viewType);
        break;
    }

    const _soggetto = this._getSoggettoNome(this.verifica);

    _path = `${this.environmentId}/${this.verifica}/${_soggetto}${_provider}/${this.api.nome}/${this.api.versione}/${this.type}/${this._stato}`;

    this.apiService.getMonitor(_path, _aux).subscribe({
      next: (response: any) => {
        this._result = this._normalizeResult(response);
        this._loading = false;
        if ((this._stato === 'scaduti') && this._isValidOk(this._result)) {
          this._stato = 'in-scadenza';
          setTimeout(() => {
            this._loadEsito();
          }, 200);
        } else {
          this._loading = false;
          if (this._isValidOk(this._result) && (this.viewType !== ViewType.All)) {
            this._showVesaDetails = false;
            this._showDetails = false;
          }
        }
      },
      error: (error: any) => {
        this._result = {
          esito: 'http_error',
          dettagli: (JSON.stringify(error) || 'Http error') + '\n\n' + _path
        };
        this._showDetails = true;
        this._loading = false;
      }
    });
  }

  public _vesaEsito: any = { esito: 'ok' };
  public _vesa: any[] = [];

  _loadAllErogazioni() {
    const reqs: Observable<any>[] = [];
    const paths: any[] = [];

    this.adhesions.forEach(adhesion => {
      const _provider: string = adhesion.soggetto.nome;
      
      let _aux: any;
      let _path: string = '';
      switch (this.viewType) {
        case ViewType.All:
        case ViewType.Certificati:
        case ViewType.Connettivita:
          this._stato = (this.type === 'backend') ? 'stato' : 'scaduti';
          break;
  
        case ViewType.Violazioni:
          _aux = { params: this.utilService._queryToHttpParams(this.period) };  
          this._stato = 'stato';
          this.type = 'rate-limiting';
          break;
          
        case ViewType.EventiConnection:
          _aux = { params: this.utilService._queryToHttpParams(this.period) };  
          this._stato = 'stato';
          this.type = 'connection-timeout';
          break;
  
        case ViewType.EventiRead:
          _aux = { params: this.utilService._queryToHttpParams(this.period) };  
          this._stato = 'stato';
          this.type = 'read-timeout';
          break;
      
        default:
          console.log('Error viewType', this.viewType);
          break;
      }

      const _soggetto = this._getSoggettoNome(this.verifica);

      _path = `${this.environmentId}/${this.verifica}/${_provider}/${_soggetto}/${this.api.nome}/${this.api.versione}/${this.type}`;

      paths.push(_path);
      reqs.push(
        this.apiService.getMonitor(`${_path}/${this._stato}`, _aux)
          .pipe(
            catchError((err) => {
              return of({ items: [] });
            })
          )
      );
    });

    this._showVesaDetails = (this.viewType !== ViewType.All);
    this._showDetails = (this.viewType !== ViewType.All);
    this._loading = true;
    this._vesa = [];

    forkJoin(reqs).subscribe({
      next: (results: Array<any>) => {
        results.forEach((result, index) => {
          const _loading = this._isValidOk(result) && (this.type === 'certificati');
          this._vesa.push({
            uid: Math.random().toString(36).slice(2, 7),
            index: index,
            adhesion: this.adhesions[index],
            result: this._normalizeResult(result),
            open: false,
            loading: _loading
          });
          if (_loading) {
            this._vesaEsito.esito = 'ok';
            this._loadInScadenza(paths[index], index);
          }
        });
        this._hasErrorVesa(this._vesa);
        this._loading = false;
      },
      error: (error: any) => {
        console.log('_loadAllErogatori forkJoin', error);
        this._vesa = [];
      }
    });
  }

  _loadInScadenza(path: string, index: number) {
    const _stato = 'in-scadenza';
    this.apiService.getMonitor(`${path}/${_stato}`).subscribe({
      next: (response: any) => {
        this._result = this._normalizeResult(response);
        this._vesa[index].result = this._normalizeResult(response);
        this._vesa[index].loading = false;
        this._hasErrorVesa(this._vesa);
      },
      error: (error: any) => {
        this._vesa[index].result = {
          esito: 'http_error',
          dettagli: (JSON.stringify(error) || 'Http error') + '\n\n' + path
        };
        this._vesa[index].loading = false;
        this._vesa[index].open = false;
        this._hasErrorVesa(this._vesa);
      }
    })
  }

  _normalizeResult(result: any) {
    let _esito = result.esito;
    switch (result.esito) {
      case 'valido':
        _esito = 'ok';
        break;
      case 'in_scadenza':
        _esito = 'warning';
        break;
      case 'scaduto':
        _esito = 'errore';
        break;
      default:
        break;
    }
    return {
      ...result,
      esito: _esito
    };
  }

  _hasErrorVesa(arr: any[]) {
    arr.every(elem => {
      if (this._isNotValidoOk(elem.result)) {
        this._vesaEsito = this._normalizeResult(elem.result);
        return false;
      }
      return true;
    });
  }

  _isNotValidoOk(data: any) {
    return (data?.esito !== 'valido') && (data?.esito !== 'ok');
  }

  _onVesaDetails(event: any, esito: any) {
    if (this._isNotValidoOk(esito) || event.altKey) {
      this._showVesaDetails = !this._showVesaDetails;
    }
  }

  _onErrorDetails(event: any, item: any, divId: string) {
    item.open = !item.open;
    if (item.open) { this.scrollToTop(divId); }
  }

  _onDetails(event: any, esito: any) {
    if (this._isNotValidoOk(esito)) {
      this._showDetails = !this._showDetails;
    }
  }

  _getColor(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.color : 'secondary';
  }

  _getColorMapper = (data: any): string => {
    return this._getColor(data);
  }

  _getColorHex(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.colorHex : 'transparent';
  }

  _getColorHexMapper = (data: any): string => {
    return this._getColorHex(data);
  }

  _getColorLabelHex(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? '#ffffff' : '#111111';
  }

  _getColorLabelHexMapper = (data: any): string => {
    return this._getColorLabelHex(data);
  }

  _getLabel(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.label : data.esito;
  }

  _getLabelMapper = (data: any): string => {
    return this._getLabel(data);
  }

  _isValidOk(data: any) {
    return data ? (data.esito === 'valido') || (data.esito === 'ok') : false;
  }

  _isValidOkMapper = (data: any): boolean => {
    return this._isValidOk(data);
  }

  _getSoggettoId(verifica: string) {
    return (verifica === 'erogazioni') ? this.service?.dominio?.soggetto_referente?.nome : this.service?.soggetto_interno?.nome;
  }

  _getSoggettoNome(verifica: string) {
    return this.service?.soggetto_interno?.nome || this.service?.dominio?.soggetto_referente?.nome
  }

  scrollToBottom() {
    const div = document.getElementById(this.uid);
    div?.scrollTo({
      top: div.scrollHeight,
      behavior: 'smooth'
    });
  }

  scrollToTop(id: string) {
    setTimeout(() => {
      const scroller = document.getElementById(this.uid);
      const div = document.getElementById(id);
      if (div && scroller) {
        scroller.scrollTo({
          top: div.offsetTop - scroller.offsetTop,
          behavior: 'smooth'
        });
      }
    }, 200);
  }
}
