import { AfterContentChecked, Component, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { EventType } from '@linkit/components';
import { EventsManagerService } from '@linkit/components'
import { AuthenticationService } from '../../services/authentication.service';
import { OpenAPIService } from '../../services/openAPI.service';
import { Tools } from '@linkit/components';
import { UtilService } from '@app/services/utils.service';
import { SearchBarFormComponent } from '@linkit/components';

import { Page } from '@app/models/page';
import { INavData } from '../../containers/gp-layout/gp-sidebar-nav';
import { navItemsMainMenu } from '../../containers/gp-layout/_nav';
import { environment } from '@app/environments/environment';

import { AmbienteEnum } from '../../model/ambienteEnum';

import { ModelType, SectionType, DashboardSections } from './data';

import * as moment from 'moment';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'DashboardComponent';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('viewTemplate') viewTemplate!: any;

  ModelType = ModelType;

  config: any;
  appConfig: any;
  _production: boolean = environment.production;

  _spin: boolean = false;
  _spinDetails: boolean = false;
  desktop: boolean = false;

  gridCols = 3;

  environmentId: AmbienteEnum = AmbienteEnum.SceltaAmbiente;

  navItems: INavData[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Dashboard', url: '', type: 'title', icon: 'dashboard' }
  ];

  _useTheme: boolean = false;
  _dashboardReduced: boolean = true;

  detailsTitle: string = 'View';
  showDetails: boolean = false;
  currentSection: any = null;
  currentBlock: any = null;
  currentElement: any = null;

  SectionType = SectionType;

  _dashboardSections = DashboardSections;
  api_url: string = '';

  _modalViewRef!: BsModalRef;

  _error: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  elements: any[] = [];
  _page: Page = new Page({});
  _links: any = {};
  _preventMultiCall: boolean = false;

  _minutesPeriodo1: number = 0;
  _minutesPeriodo2: number = 0;

  periodo1!: { periodo1_data_inizio_verifica: string, periodo1_data_fine_verifica: string};
  periodo2!: { periodo2_data_inizio_verifica: string, periodo2_data_fine_verifica: string};

  objectKeys = Object.keys;

  _updateMapper: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private modalService: BsModalService,
    private translate: TranslateService,
    private configService: ConfigService,
    private eventsManagerService: EventsManagerService,
    private authenticationService: AuthenticationService,
    private apiService: OpenAPIService,
    private utilService: UtilService
  ) {
    this.appConfig = this.configService.getConfiguration();
    this.api_url = this.appConfig.AppConfig.GOVAPI.HOST;
    const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
    this.environmentId = _dashboardRemoteConfig.ambiente_default || AmbienteEnum.SceltaAmbiente;
    this._minutesPeriodo1 = _dashboardRemoteConfig.periodi.periodo_1;
    this._minutesPeriodo2 = _dashboardRemoteConfig.periodi.periodo_2;

    this._setPeriods();

    this.configService.getConfig('dashboard').subscribe(
      (config: any) => {
        this.config = config;
        this._useTheme = this.config.useTheme ? this.config.useTheme : false;
        this._dashboardReduced = this.config.reduced ? this.config.reduced : false;
      }
    );

    this.navItems = [...navItemsMainMenu];

    this._setErrorMessages();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 't' && event.ctrlKey) {
      this._toggleTheme();
    }
    if (event.key === 'r' && event.ctrlKey) {
      this._toggleReduced();
    }
  }

  ngOnInit() {
  }

  ngOnDestroy() {
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _setErrorMessages(error: boolean = false) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      if (this.environmentId) {
        this._message = 'APP.MESSAGE.NoResults';
        this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
      } else {
        this._message = 'APP.MESSAGE.ChooseEnvironment';
        this._messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';
      }
    }
  }

  _setPeriods() {
    this.periodo1 = {
      periodo1_data_inizio_verifica: moment().add(-this._minutesPeriodo1, 'minutes').format(),
      periodo1_data_fine_verifica: moment().format()
    };
    
    this.periodo2 = {
      periodo2_data_inizio_verifica: moment().add(-this._minutesPeriodo2, 'minutes').format(),
      periodo2_data_fine_verifica: moment().format()
    };

    this._updateMapper = new Date().getTime().toString();
  }

  _prepareServicesData(data: any[]) {
    let _elements: any[] = [];
    if (data) {
      const _list: any = data.map((service: any, index: number) => {
        const _meta: string[] = [];
        if (service.descrizione_sintetica) {
          _meta.push(Tools.TruncateRows(service.descrizione_sintetica));
        }

        let _visibilita = service.visibilita || 'dominio';
        if (!service.visibilita && service.dominio) {
          _visibilita = service.visibilita ? service.visibilita : `${service.dominio.visibilita}`;
        }
        service.visibilita = _visibilita;
        const element = {
          id: service.id_servizio || index,
          editMode: false,
          source: { ...service, visibilita: _visibilita, logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '' },
          nome: service.nome,
          versione: service.versione || '',  
          logo: service.immagine ? `${this.api_url}/servizi/${service.id_servizio}/immagine`: '',
          descrizione: service.descrizione || '',
          stato: service.stato || ''
        };
        return element;
      });
      _elements = [..._list];
    }
    return _elements;
  }

  _prepareClientsData(data: any[]) {
    let _elements: any[] = [];
    if (data) {
      const _list: any[] = data.map((client: any, index: number) => {
        const element = {
          id: client.id_client || index,
          editMode: false,
          source: { ...client },
          nome: client.nome
        };
        return element;
      });
      _elements = [..._list];
    }
    return _elements;
  }

  refresh() {
    this._setPeriods();
    this.eventsManagerService.broadcast(EventType.REFRESH_DATA);
  }

  _hasPermission(menu: any) {
    return this.authenticationService.hasPermission(menu.permission, 'view');
  }

  openDetails(data: any) {
    const section: any = data.section;
    const block: any = data.block;

    this.currentSection = section;
    this.currentBlock = block;
    this.showDetails = (this.currentBlock.count > 0);
    console.log('openDetails', this.currentBlock);

    if (this.showDetails) {
      // const _model = this.translate.instant(`APP.DASHBOARD.${this.currentBlock.model}`);
      const _type = this.translate.instant(`APP.DASHBOARD.${this.currentBlock.type}`);
      // const _environmentId = this.translate.instant(`APP.DASHBOARD.${this.environmentId}`);
      const _section = this.translate.instant(section.title);
      this.detailsTitle = `${_type} - ${_section}`;

      this._loadData(this._getDataUri());
    } else {
      this.elements = [];
    }
  }

  _getBlockPeriodParams() {
    let _period: any = {}
    if (this.currentBlock.name === 'periodo1') {
      _period = {
        data_inizio_verifica: this.periodo1.periodo1_data_inizio_verifica,
        data_fine_verifica: this.periodo1.periodo1_data_fine_verifica
      };
    }
    if (this.currentBlock.name === 'periodo2') {
      _period = {
        data_inizio_verifica: this.periodo2.periodo2_data_inizio_verifica,
        data_fine_verifica: this.periodo2.periodo2_data_fine_verifica
      };
    }

    return _period;
  }

  _loadData(url: string = '', nextUrl: string = '') {
    this._setErrorMessages(false);

    if (!nextUrl) { this.elements = []; }

    let aux: any;
    const _data: any = this._getBlockPeriodParams();
    if (_data) aux = { params: this.utilService._queryToHttpParams(_data) };

    this._spinDetails = true;
    this.apiService.getMonitor(url, aux, nextUrl).subscribe({
      next: (response: any) => {
        response ? this._page = new Page(response.page) : null;
        response ? this._links = response._links || null : null;

        let _list: any[] = [];
        if (response && response.content) {
          if (this.currentBlock.model === ModelType.Servizi) {
            _list = this._prepareServicesData(response.content);
          }
          if (this.currentBlock.model === ModelType.Clients) {
            _list = this._prepareClientsData(response.content);
          }
        }

        this.elements = (nextUrl) ? [...this.elements, ..._list] : [..._list];

        this._preventMultiCall = false;
        this._spinDetails = false;
      },
      error: (error: any) => {
        console.log('error', error);
        this._preventMultiCall = false;
        this._spinDetails = false;
      }
    });
  }

  _loadMoreData() {
    if (this._links && this._links.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadData(this._getDataUri(), this._links.next.href);
    }
  }

  closeDetails() {
    this.showDetails = false;
    this.clearAll();
  }

  _showCollaudo() {
    this.environmentId = AmbienteEnum.Collaudo;
  }

  _showProduzione() {
    this.environmentId = AmbienteEnum.Produzione;
  }

  _isCollaudo() {
    return (this.environmentId === AmbienteEnum.Collaudo);
  }

  _isProduzione() {
    return (this.environmentId === AmbienteEnum.Produzione);
  }

  _onView(event: any) {
    this.currentElement = event;
    this._modalViewRef = this.modalService.show(this.viewTemplate, {
      ignoreBackdropClick: false,
      class: 'modal-lg'
    });
  }
  
  closeModal() {
    this._modalViewRef.hide();
  }
  
  _getModalTitle() {
    const _verifiche = this.translate.instant('APP.TITLE.Check');
    let _model = ''; 
    let _nome = ''; 
    if (this.currentBlock.model === 'servizi') {
      _model = this.translate.instant('APP.DASHBOARD.servizio');
      _nome = `${this.currentElement.source.nome} v.${this.currentElement.source.versione}`;
    } else {
      _model = this.translate.instant('APP.DASHBOARD.client');
      _nome = `${this.currentElement.source.nome}`;
    }
    const _type = this.translate.instant('APP.DASHBOARD.' + this.currentBlock.type);

    return `${_verifiche} ${_type} ${_model} "${_nome}"`;
  }

  clearAll() {
    this.currentSection = null;
    this.currentBlock = null;
    this.currentElement = null;
    this.elements = [];
    this._page = new Page({});
    this._links = null;
  }

  _getDataUri() {
    if (this.environmentId && this.currentBlock) {
      return `${this.environmentId}/${this.currentBlock.path}`;
    }
    return '';
  }

  _toggleTheme() {
    this._useTheme = !this._useTheme;
  }

  _toggleReduced() {
    this._dashboardReduced = !this._dashboardReduced;
  }

  _tooltipPeriod = (): string => {
    const periodo1_inizio = this.periodo1.periodo1_data_inizio_verifica;
    const periodo1_fine = this.periodo1.periodo1_data_fine_verifica;
    const periodo2_inizio = this.periodo2.periodo2_data_inizio_verifica;
    const periodo2_fine = this.periodo2.periodo2_data_fine_verifica;

    return `${periodo1_inizio} - ${periodo1_fine}\n${periodo2_inizio} - ${periodo2_fine}`;
  }

  _getBlockPeriod(block: any) {
    if (!block) return 0;
    return (block.name) ? this._minutesPeriodo1 : this._minutesPeriodo2;
  }

  _getBlockPeriodHours(block: any) {
    if (!block) return 0;
    const _period = (block.name === 'periodo1') ? this._minutesPeriodo1 : this._minutesPeriodo2;
    return Math.floor(_period / 60);
  }

  _getBlockTranslateData(block: any) {
    if (!block) return null;
    const _period = (block.name === 'periodo1') ? this._minutesPeriodo1 : this._minutesPeriodo2;
    const _hours = String(Math.floor(_period / 60));
    let _minutes = String(_period % 60);
    if (_minutes === '0') {
      _minutes = '';
    } else {
      _minutes = `e ${_minutes}'`;
    }

    return {hours: _hours, minutes: _minutes };
  }

  _getBlockPeriodParamsMapper = (): boolean => {
    return this._getBlockPeriodParams();
  }
}
