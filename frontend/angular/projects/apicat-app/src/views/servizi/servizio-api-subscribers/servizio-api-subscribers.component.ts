/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { AfterContentChecked, Component, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { COMPONENTS_IMPORTS, Tools, ConfigService, SearchBarFormComponent } from '@linkit/components';
import { PdndService, Purpose } from '@app/views/pdnd/pdnd.service';
import { AutoFillScrollDirective } from '@app/lib/directives/auto-fill-scroll.directive';
import { MonitorDropdwnComponent } from '../components/monitor-dropdown/monitor-dropdown.component';
import { getPdndEserviceId } from '../pdnd-menu.util';
import { AzionePdnd, EsitoAzionePdnd, OggettoAzionePdnd, PdndAzioneDialogComponent } from './pdnd-azione-dialog/pdnd-azione-dialog.component';
import { Router, ActivatedRoute } from '@angular/router';
import { FormGroup, UntypedFormControl, UntypedFormGroup } from '@angular/forms';

import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';

import { TranslateService } from '@ngx-translate/core';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Page } from '@app/models/page';
import { Grant } from '@app/model/grant';

import { Observable, Subject } from 'rxjs';

import * as _ from 'lodash';

export interface AzioneMenuPdnd {
  code: AzionePdnd;
  label: string;
  icon: string;
  danger?: boolean;
}

const AZIONE_APPROVA: AzioneMenuPdnd = { code: 'approve', label: 'APP.SUBSCRIBERS.ACTIONS.Approve', icon: 'bi-check-lg' };
const AZIONE_RIFIUTA: AzioneMenuPdnd = { code: 'reject', label: 'APP.SUBSCRIBERS.ACTIONS.Reject', icon: 'bi-x-lg', danger: true };
const AZIONE_SOSPENDI: AzioneMenuPdnd = { code: 'suspend', label: 'APP.SUBSCRIBERS.ACTIONS.Suspend', icon: 'bi-pause-circle' };
const AZIONE_RIATTIVA: AzioneMenuPdnd = { code: 'unsuspend', label: 'APP.SUBSCRIBERS.ACTIONS.Unsuspend', icon: 'bi-play-circle' };

// Elenchi costanti: riferimenti stabili per il template
const AZIONI_APPROVA_RIFIUTA: AzioneMenuPdnd[] = [AZIONE_APPROVA, AZIONE_RIFIUTA];
const AZIONI_APPROVA: AzioneMenuPdnd[] = [AZIONE_APPROVA];
const AZIONI_SOSPENDI: AzioneMenuPdnd[] = [AZIONE_SOSPENDI];
const AZIONI_APPROVA_SOSPENDI: AzioneMenuPdnd[] = [AZIONE_APPROVA, AZIONE_SOSPENDI];
const AZIONI_RIATTIVA: AzioneMenuPdnd[] = [AZIONE_RIATTIVA];
const AZIONI_APPROVA_RIATTIVA: AzioneMenuPdnd[] = [AZIONE_APPROVA, AZIONE_RIATTIVA];
const NESSUNA_AZIONE: AzioneMenuPdnd[] = [];
const NESSUNA_SOSPENSIONE: string[] = [];

const SOSPESO_DA_EROGATORE = 'APP.SUBSCRIBERS.SUSPENDED_BY.PRODUCER';
const SOSPESO_DA_FRUITORE = 'APP.SUBSCRIBERS.SUSPENDED_BY.CONSUMER';
const SOSPESO_DA_PIATTAFORMA = 'APP.SUBSCRIBERS.SUSPENDED_BY.PLATFORM';

@Component({
  selector: 'app-servizio-api-subscribers',
  templateUrl: 'servizio-api-subscribers.component.html',
  styleUrls: ['servizio-api-subscribers.component.scss'],
  standalone: true,
  imports: [CommonModule, ...COMPONENTS_IMPORTS, AutoFillScrollDirective, MonitorDropdwnComponent]
})
export class ServizioApiSubscribersComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'ServizioApiSubscribersComponent';
  readonly model: string = 'api';

  @ViewChild('searchBarForm') searchBarForm!: SearchBarFormComponent;
  @ViewChild('editTemplate') editTemplate!: any;

  // Modalità "embedded" (dialog): dati da @Input, chrome di pagina nascosto.
  @Input() embedded: boolean = false;
  @Input() inputSid: string | null = null;
  @Input() inputApiId: number | null = null;
  @Input() inputProducerIdCollaudo: string = '';
  @Input() inputProducerIdProduzione: string = '';

  id: number = 0;
  sid: string | null = null;

  environmentId: string = ''; // collaudo / produzione

  eserviceId: string = '';
  producerId: string = '';
  producerIdCollaudo: string = '';
  producerIdProduzione: string = '';

  _hasTabCollaudo: boolean = false;
  _hasTabProduzione: boolean = false;

  Tools = Tools;

  config: any;
  apisubscribersConfig: any;

  service: any = null;
  servizioApi: any = null;
  servizioapisubscribers: any[] = [];
  _page: Page = new Page({});
  _links: any = {};
  _allElements: number = 0;

  _grant: Grant | null = null;

  _isEdit: boolean = false;
  _editCurrent: any = null;

  _hasFilter: boolean = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _filterData: any[] = [];

  _preventMultiCall: boolean = false;

  _spin: boolean = true;
  // Vero quando la lista e` stata caricata o non c'e` nulla da caricare: evita il messaggio di lista vuota durante l'avvio
  _loaded: boolean = false;
  private _tabInizializzate: boolean = false;

  get _caricamento(): boolean {
    return this._spin || !this._loaded;
  }
  desktop: boolean = false;

  _useRoute : boolean = false;
  _useDialog : boolean = true;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';

  _error: boolean = false;

  _errorSave: boolean = false;
  _errorSaveMsg: string = 'false';

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [];

  searchFields: any[] = [];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.TITLE.PDNDSubscribers', url: '', type: 'link' }
  ];

  _modalEditRef!: BsModalRef;
  _modalConfirmRef!: BsModalRef;

  _editFormGroup: FormGroup = new FormGroup({});

  minLengthTerm: number = 1;
  apisubscribers$!: Observable<any[]>;
  apisubscribersInput$ = new Subject<string>();
  apisubscribersLoading: boolean = false;
  apisubscribersFilter: string = '';

  anagrafiche: any = {};

  _updateMapper: string = '';

  _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

  _fromDashboard: boolean = false;
  _dashboardSection: string = '';

  hideVersions: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService,
    private readonly modalService: BsModalService,
    private readonly pdndService: PdndService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
    this.hideVersions = this.config?.AppConfig?.Services?.hideVersions || false;
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;

    this._initSearchForm();

    this.route.queryParams.subscribe((val) => {
      if (val.from === 'dashboard') {
        this._fromDashboard = true;
        this._dashboardSection = val.section || '';
        this._initBreadcrumb();
      }
    });
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    if (this.embedded) {
      this.sid = this.inputSid;
      this.id = this.inputApiId || 0;
      this.producerIdCollaudo = this.inputProducerIdCollaudo || '';
      this.producerIdProduzione = this.inputProducerIdProduzione || '';
      this.configService.getConfig('subscribers').subscribe((config: any) => {
        this.apisubscribersConfig = config;
        if (this.sid) {
          this._loadServizio();
        }
      });
      return;
    }

    this.route.params.subscribe(params => {
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id) {
        this.sid = _id;
        this.id = params['aid'];
        this.environmentId = params['id_ambiente'] || '';
        this.configService.getConfig('subscribers').subscribe(
          (config: any) => {
            this.apisubscribersConfig = config;
            if (!this.service) {
              this._loadServizio();
            } else {
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._autoSelectTab();
            }
          }
        );
      }
    });

    this.route.queryParams.subscribe(params => {
      this.producerIdCollaudo = params.producerIdCollaudo || '';
      this.producerIdProduzione = params.producerIdProduzione || '';
      this._loadServizioApiSubscribers();
    });
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _initBreadcrumb() {
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _api = this.servizioApi;
    const _titleAPI = _api ? `${_api.nome} v. ${_api.versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');

    let title = (_nome && _versione) ? (this.hideVersions ? `${_nome}` : `${_nome} v. ${_versione}`) : this.id ? `${this.id}` : '...';
    let baseUrl = `/servizi`;

    if (this._componentBreadcrumbs) {
      title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
      baseUrl = `/servizi/${this._componentBreadcrumbs.service.id_servizio}/componenti`;
    }

    const _mainLabel = this._componentBreadcrumbs ? 'APP.TITLE.Components' : 'APP.TITLE.Services';
    const _mainTooltip = this._componentBreadcrumbs ? 'APP.TOOLTIP.ComponentsList' : '';
    const _mainIcon = this._componentBreadcrumbs ? '' : 'grid-3x3-gap';

    this.breadcrumbs = [
      { label: _mainLabel, url: `${baseUrl}/`, type: 'link', iconBs: _mainIcon, tooltip: _mainTooltip },
      { label: `${title}`, url: `${baseUrl}/${this.sid}`, type: 'link', tooltip: _toolTipServizio },
      { label: 'APP.SERVICES.TITLE.API', url: `${baseUrl}/${this.sid}/api`, type: 'link', tooltip: 'APP.TOOLTIP.ApiList' },
      { label: `${_titleAPI}`, url: `${baseUrl}/${this.sid}/api/${this.id}`, type: 'link', tooltip: '' },
      { label: 'APP.TITLE.PDNDSubscribers', url: ``, type: 'link' }
    ];

    if(this._componentBreadcrumbs){
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }

    if (this._fromDashboard && !this._componentBreadcrumbs) {
      const _dashboardParams = this._dashboardSection ? { section: this._dashboardSection } : null;
      this.breadcrumbs[0] = { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams };
    }
  }

  _setErrorMessages(error: boolean) {
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

  _initSearchForm() {
    this._formGroup = new UntypedFormGroup({
      organizationTaxCode: new UntypedFormControl(''),
      creationDateFrom: new UntypedFormControl(''),
      creationDateTo: new UntypedFormControl('')
    });
  }

  _loadServizio() {
    if (this.sid) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails('servizi', this.sid, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          this.apiService.getDetails('servizi', this.sid).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._updateMapper = new Date().getTime().toString();
              this._spin = false;
              this._loadServizioApi();
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
              this._loaded = true;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
          this._loaded = true;
        }
      });
    }
  }

  _loadServizioApi() {
    if (this.id) {
      this.servizioApi = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.servizioApi = response;
          this._initBreadcrumb();
          this._autoSelectTab();
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._loaded = true;
        }
      });
    } else {
      this._loaded = true;
    }
  }

  _getEService(environment: string) {
    return getPdndEserviceId(this.servizioApi, environment);
  }

  _hasPDNDConfiguredMapper = (environment: string): boolean => {
    return !!this._getEService(environment);
  }

  _loadServizioApiSubscribers(query: any = null, url: string = '') {
    this._setErrorMessages(false);
    if (!this.eserviceId || !this.producerId) {
      if (this._tabInizializzate) { this._loaded = true; }
      return;
    }
    if (this.id) {
      this._spin = true;
      if (!url) { this.servizioapisubscribers = []; this._links = null; this._purposesByAgreement = {}; this._expanded = {}; }
      let aux: any;
      if (!url) {
        query = { ...query, eserviceId: this.eserviceId, producerId: this.producerId };
        if (query) aux = { params: this.utils._queryToHttpParams(query) };
      }
      this.apiService.getListPDND(`${this.environmentId}/subscribers`, aux, url).subscribe({
        next: (response: any) => {

          if (response) {
            this._page = new Page(response.page);
            this._links = response._links || null;
          }

          this._allElements = this._page.totalElements || 0;
  
          if (response?.subscribers) {
            const _list: any = response.subscribers.map((subscriber: any) => {
              const _origin_external = `${subscriber.externalId.origin} ${subscriber.externalId.id}`; 
              const element = {
                id: subscriber.consumerId,
                editMode: false,
                enableCollapse: true,
                source: { ...subscriber, origin_external: _origin_external }
              };
              return element;
            });
            this.servizioapisubscribers = (url) ? [...this.servizioapisubscribers, ..._list] : [..._list];
            this._preventMultiCall = false;
          }
          this._spin = false;
          this._loaded = true;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
          this._spin = false;
          this._loaded = true;
        }
      });
    } else if (this._tabInizializzate) {
      this._loaded = true;
    }
  }

  __loadMoreData() {
    if (this._links?.next && !this._preventMultiCall) {
      this._preventMultiCall = true;
      this._loadServizioApiSubscribers(null, this._links.next.href);
    }
  }

  // -------------------------------------------------------------------------
  // Issue 250 (Fase 2): approvazione accordo del fruitore (solo PDND admin).
  // -------------------------------------------------------------------------

  /** L'approvazione e` disponibile solo con integrazione PDND v3
   *  (`generale.pdnd_version === 'v3'`; assente = v1). */
  get _pdndApprovalAvailable(): boolean {
    return this.authenticationService.isPdndV3();
  }

  /** Mostra l'azione "Approva" solo per un PDND admin, con approvazione
   *  disponibile (PDND != v1) e su righe con accordo in PENDING. */
  _canApprove(source: any): boolean {
    return this.authenticationService.isPdndAdmin()
      && this._pdndApprovalAvailable
      && source?.state === 'PENDING'
      && !!source?.agreementId;
  }

  /** Conferma e approva l'accordo del fruitore, poi ricarica la lista. */
  _onApprove(source: any) {
    if (!this._canApprove(source)) { return; }
    this._confermaAccordo(source, 'approve', () => this.pdndService.approveAgreement(this.environmentId, source.agreementId));
  }

  // -------------------------------------------------------------------------
  // Finalita` del fruitore: caricate alla prima apertura della riga, con lo
  // sblocco di quelle che hanno una richiesta di aumento in attesa.
  // -------------------------------------------------------------------------

  _purposesByAgreement: { [agreementId: string]: { loading: boolean; error: boolean; items: Purpose[] } } = {};

  _expanded: { [consumerId: string]: boolean } = {};

  _toggleSubscriber(subscriber: any) {
    this._expanded[subscriber.id] = !this._expanded[subscriber.id];
    if (this._expanded[subscriber.id]) { this._onSubscriberOpened(subscriber.source); }
  }

  _initials(name: string | null | undefined): string {
    const _parole = (name || '').trim().split(/\s+/).filter((p) => /^[\p{L}\p{N}]/u.test(p));
    return ((_parole[0]?.[0] || '') + (_parole[1]?.[0] || '')).toUpperCase();
  }

  /** Finalita` con richiesta di aumento in attesa (0 finche' non sono caricate). */
  _purposesWaiting(agreementId: string | null | undefined): number {
    const _ps = agreementId ? this._purposesByAgreement[agreementId] : null;
    return (_ps?.items || []).filter((p: Purpose) => !!p.waitingForApproval).length;
  }

  _statoLabel(tipo: 'AGREEMENT_STATE' | 'PURPOSE_STATE', state: string): string {
    return `APP.SUBSCRIBERS.${tipo}.${state}`;
  }

  private get _azioniAbilitate(): boolean {
    return this.authenticationService.isPdndAdmin() && this._pdndApprovalAvailable;
  }

  /**
   * Azioni sull'accordo: in attesa approva/rifiuta, attivo sospendi, sospeso riattiva solo se la
   * sospensione e` dell'erogatore (quelle di fruitore e piattaforma non si revocano da qui).
   */
  _azioniAccordo(source: any): AzioneMenuPdnd[] {
    if (!this._azioniAbilitate || !source?.agreementId) { return NESSUNA_AZIONE; }
    switch (source.state) {
      case 'PENDING': return AZIONI_APPROVA_RIFIUTA;
      case 'ACTIVE': return AZIONI_SOSPENDI;
      case 'SUSPENDED': return source.suspendedByProducer === true ? AZIONI_RIATTIVA : NESSUNA_AZIONE;
      default: return NESSUNA_AZIONE;
    }
  }

  /**
   * Azioni sulla finalita`: approvazione se c'e` una versione in attesa (indipendente dallo stato),
   * sospensione e riattivazione come per l'accordo. Il rifiuto non e` esposto dalla PDND.
   */
  _azioniFinalita(purpose: Purpose): AzioneMenuPdnd[] {
    if (!this._azioniAbilitate || !purpose) { return NESSUNA_AZIONE; }
    const _inAttesa = !!purpose.waitingForApproval;
    if (purpose.state === 'ACTIVE') { return _inAttesa ? AZIONI_APPROVA_SOSPENDI : AZIONI_SOSPENDI; }
    if (purpose.state === 'SUSPENDED' && purpose.suspendedByProducer === true) { return _inAttesa ? AZIONI_APPROVA_RIATTIVA : AZIONI_RIATTIVA; }
    return _inAttesa ? AZIONI_APPROVA : NESSUNA_AZIONE;
  }

  /** Finalita` mai attivata: la versione in attesa e` la prima, non un aumento. */
  _primaApprovazione(purpose: Purpose): boolean {
    return purpose?.state === 'WAITING_FOR_APPROVAL';
  }

  /** Soggetti che hanno sospeso l'accordo o la finalita` (chiavi i18n); la piattaforma solo per gli accordi. */
  _sospensioni(oggetto: any, conPiattaforma: boolean): string[] {
    if (oggetto?.state !== 'SUSPENDED') { return NESSUNA_SOSPENSIONE; }
    const _chiavi: string[] = [];
    if (oggetto.suspendedByProducer) { _chiavi.push(SOSPESO_DA_EROGATORE); }
    if (oggetto.suspendedByConsumer) { _chiavi.push(SOSPESO_DA_FRUITORE); }
    if (conPiattaforma && oggetto.suspendedByPlatform) { _chiavi.push(SOSPESO_DA_PIATTAFORMA); }
    return _chiavi;
  }

  /** Spiegazione dello stato dell'accordo per il tooltip: motivazione del rifiuto o soggetti della sospensione. */
  _notaStatoAccordo(source: any): string {
    if (source?.state === 'REJECTED' && source.rejectionReason) {
      return `${this.translate.instant('APP.SUBSCRIBERS.RejectionReason')}: ${source.rejectionReason}`;
    }
    const _sospensioni = this._sospensioni(source, true);
    return _sospensioni.length ? `${this.translate.instant('APP.SUBSCRIBERS.SuspendedBy')}: ${this._elenco(_sospensioni)}` : '';
  }

  private _elenco(chiavi: string[]): string {
    const _voci = chiavi.map((k) => this.translate.instant(k));
    if (_voci.length < 2) { return _voci[0] || ''; }
    return `${_voci.slice(0, -1).join(', ')} ${this.translate.instant('APP.SUBSCRIBERS.And')} ${_voci.at(-1)}`;
  }

  /** Messaggio di esito; la riattivazione puo` lasciare l'oggetto sospeso per le sospensioni altrui. */
  private _notificaEsito(oggetto: OggettoAzionePdnd, azione: AzionePdnd, nome: string, risultato: any, primaApprovazione: boolean = false) {
    const _tipo = oggetto === 'purpose' ? 'PURPOSE' : 'AGREEMENT';
    if (azione === 'unsuspend' && risultato?.state === 'SUSPENDED') {
      const _altri = this._sospensioni(risultato, oggetto === 'agreement').filter((k) => k !== SOSPESO_DA_EROGATORE);
      const _chi = _altri.length ? this._elenco(_altri) : this.translate.instant(SOSPESO_DA_FRUITORE);
      Tools.showMessage(this.translate.instant(`APP.SUBSCRIBERS.RESULT.${_tipo}.StillSuspended`, { who: _chi }), 'warning', true, true);
      return;
    }
    const _chiave = primaApprovazione && azione === 'approve' ? 'approveFirst' : azione;
    Tools.showMessage(this.translate.instant(`APP.SUBSCRIBERS.RESULT.${_tipo}.${_chiave}`, { name: nome }), 'success', true);
  }

  private _conferma(azione: AzionePdnd, oggetto: OggettoAzionePdnd, dati: Partial<PdndAzioneDialogComponent>, onConferma: (motivazione: string) => void) {
    const _modalRef: BsModalRef = this.modalService.show(PdndAzioneDialogComponent, {
      ignoreBackdropClick: true,
      class: 'modal-dialog-centered modal-stacked',
      ariaLabelledBy: 'pa-title',
      initialState: { azione, oggetto, ...dati }
    });
    _modalRef.content.onClose.subscribe((esito: EsitoAzionePdnd | null) => {
      if (esito) { onConferma(esito.reason || ''); }
    });
  }

  private _confermaAccordo(source: any, azione: AzionePdnd, chiamata: (motivazione: string) => Observable<any>) {
    const _dati: Partial<PdndAzioneDialogComponent> = {
      fruitore: source?.name || '',
      statoAttuale: source?.state || '',
      altreSospensioni: this._altreSospensioni(source, true)
    };
    this._conferma(azione, 'agreement', _dati, (motivazione) => {
      this._spin = true;
      chiamata(motivazione).subscribe((res: any) => {
        if (res?.error) {
          this._spin = false;
          Tools.OnError(res.error);
          return;
        }
        this._notificaEsito('agreement', azione, source?.name || '', res?.data);
        this._loadServizioApiSubscribers(this._filterData);
      });
    });
  }

  /** Sospensioni che la riattivazione dell'erogatore non revoca (testo per la conferma). */
  private _altreSospensioni(oggetto: any, conPiattaforma: boolean): string {
    return this._elenco(this._sospensioni(oggetto, conPiattaforma).filter((k) => k !== SOSPESO_DA_EROGATORE));
  }

  private _confermaFinalita(agreementId: string, purpose: Purpose, azione: AzionePdnd, chiamata: (motivazione: string) => Observable<any>) {
    const _fruitore = this.servizioapisubscribers.find((s: any) => s.source?.agreementId === agreementId)?.source?.name || '';
    const _dati: Partial<PdndAzioneDialogComponent> = {
      fruitore: _fruitore,
      finalita: purpose.title || purpose.id,
      statoAttuale: purpose.state,
      caricoAttuale: this._formatNumber(purpose.throughput),
      caricoRichiesto: purpose.waitingForApproval ? this._formatNumber(purpose.waitingForApproval.throughput) : '',
      altreSospensioni: this._altreSospensioni(purpose, false),
      primaApprovazione: this._primaApprovazione(purpose)
    };
    this._conferma(azione, 'purpose', _dati, (motivazione) => {
      const current = this._purposesByAgreement[agreementId];
      if (current) { current.loading = true; }
      chiamata(motivazione).subscribe((res: any) => {
        if (res?.error) {
          if (current) { current.loading = false; }
          Tools.OnError(res.error);
          return;
        }
        this._notificaEsito('purpose', azione, purpose.title || purpose.id, res?.data, this._primaApprovazione(purpose));
        this._loadPurposes(agreementId);
      });
    });
  }

  /** Voce del menu: finalita` se c'e` la finalita`, altrimenti accordo del fruitore. */
  _eseguiAzione(azione: AzionePdnd, source: any, agreementId: string | null, purpose: Purpose | null) {
    if (purpose && agreementId) {
      this._onAzioneFinalita(agreementId, purpose, azione);
    } else {
      this._onAzioneAccordo(source, azione);
    }
  }

  _onAzioneAccordo(source: any, azione: AzionePdnd) {
    if (!this._azioniAccordo(source).some((a) => a.code === azione)) { return; }
    if (azione === 'approve') { this._onApprove(source); return; }
    const _env = this.environmentId;
    const _id = source.agreementId;
    this._confermaAccordo(source, azione, (motivazione) => {
      switch (azione) {
        case 'reject': return this.pdndService.rejectAgreement(_env, _id, motivazione);
        case 'suspend': return this.pdndService.suspendAgreement(_env, _id);
        default: return this.pdndService.unsuspendAgreement(_env, _id);
      }
    });
  }

  _onAzioneFinalita(agreementId: string, purpose: Purpose, azione: AzionePdnd) {
    if (!this._azioniFinalita(purpose).some((a) => a.code === azione)) { return; }
    if (azione === 'approve') { this._onApprovePurpose(agreementId, purpose); return; }
    const _env = this.environmentId;
    this._confermaFinalita(agreementId, purpose, azione, () => {
      return azione === 'suspend' ? this.pdndService.suspendPurpose(_env, purpose.id) : this.pdndService.unsuspendPurpose(_env, purpose.id);
    });
  }

  _onSubscriberOpened(source: any) {
    const agreementId: string = source?.agreementId;
    if (!agreementId || this._purposesByAgreement[agreementId]) { return; }
    this._loadPurposes(agreementId);
  }

  private _loadPurposes(agreementId: string) {
    const items = this._purposesByAgreement[agreementId]?.items || [];
    this._purposesByAgreement[agreementId] = { loading: true, error: false, items };
    this.pdndService.agreementPurposes(this.environmentId, agreementId).subscribe((res: any) => {
      this._purposesByAgreement[agreementId] = {
        loading: false,
        error: !!res?.error,
        // Prima quelle con una richiesta di aumento in attesa
        items: [...(res?.data?.purposes || [])].sort((a: Purpose, b: Purpose) => Number(!!b.waitingForApproval) - Number(!!a.waitingForApproval))
      };
    });
  }

  /** Lo sblocco dipende solo dalla presenza della versione in attesa (anche con stato ACTIVE). */
  _canApprovePurpose(purpose: Purpose): boolean {
    return this.authenticationService.isPdndAdmin()
      && this._pdndApprovalAvailable
      && !!purpose?.waitingForApproval;
  }

  _formatNumber(value: number | null | undefined): string {
    // Separatore delle migliaia anche sotto le 5 cifre (in italiano di default "5000" ma "20.000").
    return new Intl.NumberFormat(this.translate.currentLang || 'it', { useGrouping: true }).format(value ?? 0);
  }

  _onApprovePurpose(agreementId: string, purpose: Purpose) {
    if (!this._canApprovePurpose(purpose)) { return; }
    this._confermaFinalita(agreementId, purpose, 'approve', () => this.pdndService.approvePurpose(this.environmentId, purpose.id));
  }

  _onSubmit(form: any) {
    if (this.searchBarForm) {
      this.searchBarForm._onSearch();
    }
  }

  _onSearch(values: any) {
    this._filterData = values;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _resetForm() {
    this._filterData = [];
    this._loadServizioApiSubscribers(this._filterData);
  }

  _timestampToMoment(value: number) {
    return value ? new Date(value) : null;
  }

  _onSort(event: any) {
    console.log(event);
  }

  onBreadcrumb(event: any) {
    if (event.params) {
      this.router.navigate([event.url], { queryParams: event.params });
    } else {
      this.router.navigate([event.url], { queryParamsHandling: 'preserve' });
    }
  }

  _resetScroll() {
    Tools.ScrollElement('container-scroller', 0);
  }

  _showCollaudo() {
    this.environmentId = 'collaudo';
    this.eserviceId = this._getEService(this.environmentId);
    this.producerId = (this.environmentId === 'collaudo') ? this.producerIdCollaudo : this.producerIdProduzione;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _showProduzione() {
    this.environmentId = 'produzione';
    this.eserviceId = this._getEService(this.environmentId);
    this.producerId = (this.environmentId === 'collaudo') ? this.producerIdCollaudo : this.producerIdProduzione;
    this._loadServizioApiSubscribers(this._filterData);
  }

  _isCollaudo() {
    return (this.environmentId === 'collaudo');
  }

  _isProduzione() {
    return (this.environmentId === 'produzione');
  }

  _autoSelectTab() {
    this._hasTabCollaudo = this._hasPDNDConfiguredMapper('collaudo');
    this._hasTabProduzione = this._hasPDNDConfiguredMapper('produzione');
    this._tabInizializzate = true;
    if (!(this._hasTabCollaudo && this._hasTabProduzione)) {
      this._hasTabCollaudo ? this._showCollaudo() : this._showProduzione();
    } else {
      this._loaded = true;
    }
  }

  onActionMonitor(event: any) {
    switch (event.action) {
      case 'backview':
        const url = `/servizi/${this.service.id_servizio}/view`;
        this.router.navigate([url]);
        break;
      default:
        break;
    }
  }
}
