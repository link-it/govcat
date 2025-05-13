import { AfterContentChecked, Component, HostListener, Input, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { Page } from '@app/models/page';

@Component({
  selector: 'app-client-verifiche',
  templateUrl: 'client-verifiche.component.html',
  styleUrls: ['client-verifiche.component.scss'],
  standalone: false

})
export class ClientVerificheComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'VerificheComponent';
  readonly model: string = 'verifiche';

  @Input() id!: number;
  @Input() environmentId: string = 'collaudo'; // collaudo / produzione
  @Input() included: boolean = false;

  client: any = null;

  _page: Page = new Page({});
  _links: any = {};

  Tools = Tools;

  config: any;
  verificheConfig: any;

  data: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.SelectStatistic';
  _messageHelp: string = 'APP.MESSAGE.SelectVerifichelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';
  _messageNoResponseUnimplemented: string = 'APP.MESSAGE.NoResponseUnimplemented';

  _error: boolean = false;
  _errorMsg: string = '';

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Checks', url: '', type: 'title', iconBs: 'check2-square' }
  ];

  api_url: string = '';

  generalConfig: any = Tools.Configurazione;

  _twoCol: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private apiService: OpenAPIService
  ) {
    this.config = this.configService.getConfiguration();

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.client = _state?.client || null;

    this.api_url = this.config.AppConfig.GOVAPI.HOST;
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    if (!this.included) {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.id = params['id'];
          this.configService.getConfig(this.model).subscribe(
            (config: any) => {
              this.verificheConfig = config;
              this._twoCol = config.twoCol || false;

              if (!this.client) {
                this._loadClient();
              } else {
                this._initBreadcrumb();
              }
            }
          );
        }
      });
    } else {
      this.configService.getConfig(this.model).subscribe(
        (config: any) => {
          this.verificheConfig = config;
          this._twoCol = config.twoCol || false;

          this._loadClient();
        }
      );
    }
  }

  ngOnDestroy() {}

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.client ? this.client.nome : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipClient = this.client ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.client.stato) : '';
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
      { label: 'APP.TITLE.Client', url: '/client', type: 'link' },
      { label: `${_title}`, url: `/client/${this.id}`, type: 'link', tooltip: _toolTipClient },
      { label: 'APP.TITLE.Checks', url: ``, type: 'link' }
    ];
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.SelectStatistic';
      this._messageHelp = 'APP.MESSAGE.SelectVerifichelp';
    }
  }

  _loadClient() {
    if (this.id) {
      this.client = null;
      this.apiService.getDetails('client', this.id).subscribe({
        next: (response: any) => {
          this.client = { ...response };
          console.log('client: ', this.client)

          this._spin = false;
          this._initBreadcrumb();
          this._loadEsito()
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  // public adhesions: any[] = [];
  // private async loadAdhesions(id_servizio: string) { 
  //   this.apiService.getList('adesioni', {params: {id_servizio}}).subscribe({
  //     next: (response: any) => {
  //       this.adhesions = response.content;
  //     },
  //     error: (error: any) => {
  //       Tools.OnError(error);
  //     }
  //   });
  // }

  public _stato: string = 'scaduti';
  public _loading: boolean = false;
  public _result: any = null;
  public _showDetails: boolean = false;

  _esiti: any[] = [
    { value: 'valido', label: 'APP.VERIFY.ESITO.Valido', color: 'success', colorHex: '#a6d75b' },
    { value: 'in_scadenza', label: 'APP.VERIFY.ESITO.InScadenza', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'scaduto', label: 'APP.VERIFY.ESITO.Scaduto', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'http_error', label: 'APP.VERIFY.ESITO.HttpError', color: 'danger', colorHex: '#dd2b0e' },
    { value: 'ok', label: 'APP.VERIFY.ESITO.Ok', color: 'success', colorHex: '#a6d75b' },
    { value: 'warning', label: 'APP.VERIFY.ESITO.Warning', color: 'warning', colorHex: '#f0ad4e' },
    { value: 'errore', label: 'APP.VERIFY.ESITO.Errore', color: 'danger', colorHex: '#dd2b0e' },
  ];

  _loadEsito() {
    this._showDetails = this.included;
    this._loading = true;
    this._result = null;

    let type = this.client.dati_specifici.auth_type.includes('pdnd') ? 'pdnd' : 'modi';

    const soggetto = this.client.soggetto.nome;
    const nome = this.client.nome;

    const _path = `${this.environmentId}/applicativi/${type}/${soggetto}/${nome}/certificati/${this._stato}`;

    this.apiService.getMonitor(_path).subscribe({
      next: (response: any) => {
        this._result = this._normalizeResult(response);
        if ((this._stato === 'scaduti') && this._isValidOk(this._result)) {
          this._stato = 'in-scadenza';
          setTimeout(() => {
            this._loadEsito();
          }, 200);
        } else {
          this._loading = false;
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

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this._stato = 'scaduti';
    this._loadEsito();
  }
  
  _showProduzione() {
    this.environmentId = 'produzione';
    this._stato = 'scaduti';
    this._loadEsito();
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  onSelect(event: any) {
    // console.log(event);
  }

  onResize(event: any) {
    // console.log(event);
    // this.view = [event.target.innerWidth - 600, event.target.innerHeight - 200];
  }

  _hasIdentificativoeServicePDND(api: any) {
    const ac: any = api.proprieta_custom || [];
    const _iespdnd: any = ac.find((item: any) => { return item.nome === 'identificativo_eservice_pdnd' }) || null;
    return (_iespdnd !== null);
  }

  _hasIdentificativoeServicePDNDMapper = (api: any): boolean => {
    return this._hasIdentificativoeServicePDND(api);
  }

  _isErogatoSoggettoDominioMapper = (api: any): boolean => {
    return (api.ruolo === 'erogato_soggetto_dominio');
  }

  _tipoVerificaMapper = (api: any): string => {
    return (api.ruolo === 'erogato_soggetto_dominio') ? 'erogazioni' : 'fruizioni';
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
    return _esito ? _esito.colorHex : '#f1f1f1';
  }

  _getColorHexMapper = (data: any): string => {
    return this._getColorHex(data);
  }

  _getLabel(data: any) {
    const _esito: any = this._esiti.find((item: any) => { return item.value === data.esito });
    return _esito ? _esito.label : data.esito;
  }

  _getLabelMapper = (data: any): string => {
    return this._getLabel(data);
  }

  _isNotValidoOk(data: any) {
    return (data.esito !== 'valido') && (data.esito !== 'ok');
  }

  _isValidOk(data: any) {
    return data ? (data.esito === 'valido') || (data.esito === 'ok') : false;
  }

  _isValidOkMapper = (data: any): boolean => {
    return this._isValidOk(data);
  }
}
