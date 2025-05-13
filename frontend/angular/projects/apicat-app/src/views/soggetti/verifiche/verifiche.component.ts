import { AfterContentChecked, Component, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { animate, query, stagger, style, transition, trigger } from '@angular/animations';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Page } from '@app/models/page';

import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'app-verifiche',
  templateUrl: 'verifiche.component.html',
  styleUrls: ['verifiche.component.scss'],
  standalone: false

})
export class VerificheComponent implements OnInit, AfterContentChecked, OnDestroy {
  static readonly Name = 'VerificheComponent';
  readonly model: string = 'verifiche';

  id!: number;
  environmentId: string = 'collaudo'; // collaudo / produzione

  soggetto: any = null;

  _page: Page = new Page({});
  _links: any = {};

  Tools = Tools;

  config: any;
  verificheConfig: any;

  data: any[] = [];

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
  
  _isPDND: boolean = false;
  _listTokenPolicy: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService
  ) {
    this.config = this.configService.getConfiguration();

    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.soggetto = _state?.soggetto || null;

    this.api_url = this.config.AppConfig.GOVAPI.HOST;
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.id = params['id'];
        this.environmentId = params['id_ambiente'] || 'collaudo';
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.verificheConfig = config;
            this._twoCol = config.twoCol || false;

            if (!this.soggetto) {
              this._loadSoggetto();
            } else {
              this._initBreadcrumb();
            }
          }
        );
      }
    });
  }

  ngOnDestroy() {}

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _title = this.soggetto ? this.soggetto.nome : this.id;
    const _toolTipServizio = '';
    this.breadcrumbs = [
      { label: '', url: '', type: 'title', iconBs: 'grid-3x3-gap' },
      { label: 'APP.TITLE.Subjects', url: '/soggetti', type: 'link' },
      { label: `${_title}`, url: `/soggetti/${this.id}`, type: 'link', tooltip: _toolTipServizio },
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

  _getConfigSoggetto() {
    const configPDND: any = this.authenticationService._getConfigModule('pdnd');
    const configSoggetto = configPDND.find((item: any) => item.nome_soggetto === this.soggetto.nome);
    return configSoggetto;
  }

  _loadSoggetto() {
    if (this.id) {
      this._spin = true;
      this.soggetto = null;
      this.apiService.getDetails('soggetti', this.id).subscribe({
        next: (response: any) => {
          this.soggetto = response;
          this._initBreadcrumb();

          const configSoggetto = this._getConfigSoggetto();
          this._isPDND = !!configSoggetto;
          if (this.environmentId) {
            this._listTokenPolicy = configSoggetto && configSoggetto[this.environmentId] ? configSoggetto[this.environmentId].lista_policy : [];
          }
      
          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    const configSoggetto = this._getConfigSoggetto();
    this._listTokenPolicy = configSoggetto[this.environmentId]?.lista_policy || [];
}

  _showProduzione() {
    this.environmentId = 'produzione';
    const configSoggetto = this._getConfigSoggetto();
    this._listTokenPolicy = configSoggetto[this.environmentId]?.lista_policy || [];
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  onResize(event: any) {
    // console.log(event);
    // this.view = [event.target.innerWidth - 600, event.target.innerHeight - 200];
  }
}
