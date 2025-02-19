import { AfterContentChecked, Component, HostListener, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { Page } from '@app/models/page';

import * as moment from 'moment';
import * as _ from 'lodash';

export enum ViewType {
  All = 'all',
  Certificati = 'certificati',
  Connettivita = 'connettivita',
  Violazioni = 'violazioni',
  EventiConnection = 'eventi-connection',
  EventiRead = 'eventi-read'
}

@Component({
  selector: 'app-servizio-verifiche',
  templateUrl: 'verifiche.component.html',
  styleUrls: ['verifiche.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({opacity:0}),
        animate(1000, style({opacity:1})) 
      ]),
      transition(':leave', [
        animate(1000, style({opacity:0})) 
      ])
    ]),
    trigger("thumbsInOut", [
      transition(":enter", [
        query(".container-animation", [
          style({ transform: "translateY(10px)", opacity: 0 }),
          stagger(100, [
            animate(
              ".5s ease-out",
              style({
                transform: "translateX(0px)",
                opacity: 1
              })
            )
          ])
        ])
      ]),
      transition(":leave", [
        query(".container-animation", [
          style({ transform: "translateY(0px)", opacity: 1 }),
          stagger(-100, [
            animate(
              ".5s ease-out",
              style({
                transform: "translateY(10px)",
                opacity: 0
              })
            )
          ])
        ])
      ])
    ])
  ]
})
export class VerificheComponent implements OnInit, AfterContentChecked, OnChanges, OnDestroy {
  static readonly Name = 'VerificheComponent';
  readonly model: string = 'verifiche';

  @Input() id!: number;
  @Input() environmentId: string = 'collaudo'; // collaudo | produzione
  @Input() viewType: ViewType = ViewType.All;
  @Input() period: any = {};

  ViewType = ViewType;

  _viewType: ViewType = ViewType.All;

  service: any = null;
  serviceApi: any[] = [];

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
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService,
    private utils: UtilService
  ) {
    this.config = this.configService.getConfiguration();

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;

    this.api_url = this.config.AppConfig.GOVAPI.HOST;
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    if (this.viewType === ViewType.All) {
      this.route.params.subscribe(params => {
        if (params['id']) {
          this.id = params['id'];
          this.environmentId = params['id_ambiente'] || 'collaudo';
          this.configService.getConfig(this.model).subscribe(
            (config: any) => {
              this.verificheConfig = config;
              this._twoCol = config.twoCol || false;
  
              if (!this.service) {
                this._loadServizio();
                // this._loadServiceApi(false);
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

          this._loadServizio();
          // this._loadServiceApi(false);
        }
      );
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.viewType) {
      switch (changes.viewType.currentValue) {
        case ViewType.Violazioni:
        case ViewType.EventiConnection:
        case ViewType.EventiRead:
          this._viewType = ViewType.Connettivita
          break;
      
        default:
          this._viewType = changes.viewType.currentValue
          break;
      }
    }
  }

  ngOnDestroy() {}

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.service ? this.service.nome + ' v. ' + this.service.versione : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _view = (localStorage.getItem('SERVIZI_VIEW') === 'TRUE') ? '/view' : '';
    this.breadcrumbs = [
      { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
      { label: `${_title}`, url: `/servizi/${this.id}${_view}`, type: 'link', tooltip: _toolTipServizio },
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

  async _loadServizio() {
    if (this.id) {
      this.service = null;
      // this.apiService.getDetails('servizi', this.id).subscribe({
      //   next: (response: any) => {
      //     this.service = response;
      //     this._initBreadcrumb();
      //     this.loadAdhesions(this.id.toString());
      //   },
      //   error: (error: any) => {
      //     Tools.OnError(error);
      //   }
      // });
      try {
        let data = await this.apiService.getDetails('servizi', this.id).toPromise();
        if (data) {
          this.service = data;
          this._initBreadcrumb();
          this.loadAdhesions(this.id.toString());
          this._loadServiceApi(false);
        }
      } catch(error) {
        Tools.OnError(error);
      }
    }
  }

  _loadServiceApi(dominio: boolean, query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (this.id) {
      if (!url) { this.serviceApi = []; }

      let aux: any;
      let _query: any = { ...query, id_servizio: this.id, sort: `id,asc` };
      // _query.ruolo = dominio ? 'erogato_soggetto_dominio' : 'erogato_soggetto_aderente';
      if (_query) aux = { params: this.utils._queryToHttpParams(_query) };
  
      this._spin = true;
      this.apiService.getList('api', aux).subscribe({
        next: (response: any) => {

          response ? this._page = new Page(response.page) : null;
          response ? this._links = response._links || null : null;

          if (response && response.content) {
            const _list: any = response.content.map((api: any) => {
              const element = {
                id: api.id_api,
                ...api
              };
              return element;
            });
            this.serviceApi = [ ...this.serviceApi, ..._list ];
            this._preventMultiCall = false;
          }

          // setTimeout(() => {
            this._spin = false;
          // }, 1000);
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._spin = false;
        }
      });
    }
  }

  public adhesions: any[] = [];
  private async loadAdhesions(id_servizio: string) { 
    this.apiService.getList('adesioni', {params: {id_servizio}}).subscribe({
      next: (response: any) => {
        this.adhesions = response.content;
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
  }

  _showProduzione() {
    this.environmentId = 'produzione';
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

  _hasPDNDAuthType(api: any) {
    let _hasPDND: boolean = false;

    const _profili = this.authenticationService._getConfigModule('servizio')?.api?.profili || [];

    api.dati_erogazione.gruppi_auth_type.map((auth: any) => {
      const _profile = _profili.find((item: any) => item.codice_interno === auth.profilo);
      if (_profile.auth_type.includes('pdnd')) {
        _hasPDND = true;
      }
    });

    return _hasPDND;
  }

  _isSoggettoPDND() {
    const _soggettoServizio = this.service?.dominio?.soggetto_referente?.nome || '';
    const _soggettiPDND = this.authenticationService._getConfigModule('pdnd') || [];

    const _index = _soggettiPDND.findIndex((item: any) => item.nome_soggetto === _soggettoServizio);

    return (_index !== -1);
  }

  _hasIdentificativoeServicePDNDMapper = (api: any): boolean => {
    // return this._hasIdentificativoeServicePDND(api);
    // return this._hasPDNDAuthType(api);
    return this._isSoggettoPDND();
  }

  _isErogatoSoggettoDominioMapper = (api: any): boolean => {
    return (api.ruolo === 'erogato_soggetto_dominio');
  }

  _tipoVerificaMapper = (api: any): string => {
    if (api.ruolo === 'erogato_soggetto_dominio') {
      if (this.service?.soggetto_interno) {
        return 'fruizioni';
      } else {
        return 'erogazioni';
      }
    } else {
      return 'fruizioni';
    }
  }

  _isViewTypeAll = (): boolean => {
    return (this.viewType === ViewType.All);
  }

  _isViewTypeEventi = (): boolean => {
    return (this.viewType === ViewType.EventiConnection) || (this.viewType === ViewType.EventiRead);
  }

  _isViewTypeViolazioni = (): boolean => {
    return (this.viewType === ViewType.Violazioni);
  }

  _getIconTypeEventiConnettivita = (): string => {
    let _icon = 'hdd-network';
    if (this.viewType === ViewType.Violazioni) {
      _icon = 'triangle';
    }
    if (this.viewType === ViewType.EventiConnection) {
      _icon = 'clock';
    }
    if (this.viewType === ViewType.EventiRead) {
      _icon = 'clock';
    }
    return _icon;
  }

  _getTitleTypeEventiConnettivita = (): string => {
    let _title = 'APP.TITLE.Connettivita';
    if (this.viewType === ViewType.Violazioni) {
      _title = 'APP.TITLE.ViolazioniPolicyRateLimiting';
    }
    if (this.viewType === ViewType.EventiConnection) {
      _title = 'APP.TITLE.EventiConnectionTimeout';
    }
    if (this.viewType === ViewType.EventiRead) {
      _title = 'APP.TITLE.EventiReadTimeout';
    }
    return _title;
  }
}
