import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Adesione } from './adesione';
import { AdesioneCreate } from './adesioneCreate';
import { AdesioneUpdate, Servizio } from './adesioneUpdate';
import { Soggetto } from './adesioneUpdate';

import { concat, Observable, of, Subject, throwError, forkJoin } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

declare const saveAs: any;
import * as moment from 'moment';
import { Utente } from '@app/model/utente';
import { Profilo } from '@app/model/profilo';
import { RuoloUtenteEnum } from '@app/model/ruoloUtenteEnum';
import { NgSelectComponent } from '@ng-select/ng-select';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';
import { Location } from '@angular/common';
import { MenuAction } from '@linkit/components';

import { Grant } from '@app/model/grant';
import { EventType } from '@linkit/components';

@Component({
  selector: 'app-adesione-details',
  templateUrl: 'adesione-details.component.html',
  styleUrls: ['adesione-details.component.scss'],
  standalone: false
})
export class AdesioneDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'AdesioneDetailsComponent';
  readonly model: string = 'adesioni';

  @Input() id: number | null = null;
  @Input() adesione: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('ngSelectOrganizazione', {read: NgSelectComponent}) ngSelectOrganizazione: NgSelectComponent|null = null;

  Tools = Tools;

  dominio: any = null;
  richiedente: any = null;
  anagrafiche: any = null;

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _isDetails = true;

  _editable: boolean = true;
  _deleteable: boolean = false;
  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: FormGroup = new FormGroup({});
  _adesione: Adesione = new Adesione({});
  _adesioneCreate: AdesioneCreate = new AdesioneCreate({});
  _adesioneUpdate: AdesioneUpdate = new AdesioneUpdate({});

  serviceProviders: any = null;

  _spin: boolean = false;
  _downloading: boolean = true;
  _changingStatus: boolean = false;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
    { label: '...', url: '', type: 'title' }
  ];

  _error: boolean = false;
  _errorMsg: string = '';
  _errors: any[] = [];
  _fromStatus: string = '';
  _toStatus: string = '';

  _modalConfirmRef!: BsModalRef;

  apiUrl: string = '';
  _subscriptionPlaceHolder: string = './assets/images/logo-placeholder.png';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _subscriptionLogoPlaceholder: string = './assets/images/subscription-placeholder.png';

  _organizations: any[] = [];
  // _subscriptions: any[] = [];
  _selectedSubscription: any = null;


  servizi$!: Observable<any[]>;
  serviziInput$ = new Subject<string>();
  serviziLoading: boolean = false;
  selectedServizio: any;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;
  selectedSoggetto: any;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;
  selectedOrganizzazione: any;

  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;
  selectedreferente: any;

  referentiTecnici$!: Observable<any[]>;
  referentiTecniciInput$ = new Subject<string>();
  referentiTecniciLoading: boolean = false;
  selectedreferenteTecnico: any;

  minLengthTerm = 1;

  generalConfig: any = Tools.Configurazione || null;

  _singleColumn: boolean = false;

  _profilo: Profilo|null = null;
  _orgAppartenenzaUtente: any = null;

  _isBozza: boolean = false;

  _grant: Grant | null = null;
  _updateMapper: string = '';
    
  _disabled_id_soggetto: any = null;

  _id_servizio: any = null;
  _servizio: any = null;
  _isWeb: boolean = false;
  
  _hideSoggettoDropdown: boolean = true;
  _hideSoggettoInfo: boolean = true;
  _elencoSoggetti: any[] = [];

  _scelta_libera_organizzazione: boolean = false;

  _notification: any = null;
  _notificationId: string = '';
  _notificationMessageId: string = '';
  
  _otherActions: MenuAction[] = [
    new MenuAction({
      type: 'menu',
      title: 'APP.ADESIONI.LABEL.DownloadScheda',
      icon: 'download',
      subTitle: '',
      action: 'download_scheda',
      enabled: true
    }),
    new MenuAction({
      type: 'divider',
      title: '',
      enabled: true
    })
  ];

  _serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

  debugMandatoryFields: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService,
    private location: Location
  ) {
    this.route.data.subscribe((data) => {
      if (!data.serviceBreadcrumbs) return;
      this._serviceBreadcrumbs = data.serviceBreadcrumbs;

      this._isWeb = true;
      this._servizio = this._serviceBreadcrumbs?.service;
      this._id_servizio = this._serviceBreadcrumbs?.service.id_servizio;
      this._adesioneCreate.id_servizio = this._id_servizio;
      this._loadServizio(this._id_servizio, true);

      this._initBreadcrumb();
    });

    this.appConfig = this.configService.getConfiguration();
    this.apiUrl = this.appConfig.AppConfig.GOVAPI.HOST;
  }

  ngOnInit() {
    localStorage.setItem('ADESIONI_VIEW', 'FALSE');

    this._scelta_libera_organizzazione = this.generalConfig?.adesione.scelta_libera_organizzazione || false;

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.id = params['id'];
        this._isDetails = true;
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._singleColumn = config.editSingleColumn || false;
            this._loadAll();
          }
        );

      } else {
        this._initBreadcrumb();
        
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._isNew = true;
            this._singleColumn = config.editSingleColumn || false;
            this._initForm({ ...this._adesioneCreate });
            this._initSoggettiSelect([]);
            this._initOrganizzazioniSelect([]);
            this._initReferentiSelect([]);
            if (!this._id_servizio) {
              this._initServiziSelect([])
            }
            this._initReferentiTecniciSelect([]);
            setTimeout(() => {
              this._onChangeServizio(this._servizio);
            }, 900);

            this._loadProfilo();
            this._isEdit = true;
            this._spin = false;
          }
        );
      }
    });

    this.route.queryParams.subscribe((val) => {
      this._notification = null;
      this._notificationId = '';
      this._notificationMessageId = '';
      if (val.notificationId && val.messageid) {
        this._notificationId = val.notificationId;
        this._notificationMessageId = val.messageid;
      }
      if (val.notification) {
        const _notification = JSON.parse(decodeURI(atob(val.notification)));
        this._notification = _notification;
        this._notificationId = this._notification.id_notifica;
        this._notificationMessageId = this._notification.entita.id_entita;
      }

      if (val.id_servizio) {
        this._id_servizio = val.id_servizio;
        this._adesioneCreate.id_servizio = this._id_servizio;
        this._isWeb = val.web || false;
        this._loadServizio(this._id_servizio);
      } 
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      this.generalConfig = Tools.Configurazione || null;
      this._scelta_libera_organizzazione = this.generalConfig?.adesione.scelta_libera_organizzazione || false;
      this._initForm(this._adesioneCreate);
      console.log('Configurazione Remota', Tools.Configurazione);
    });
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.subscription) {
      const subscription = changes.subscription.currentValue;
      this.adesione = subscription.source;
      this.id = this.adesione.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  public onActionMonitor(event: any) {
    if(event.action == 'backview') {
      this.router.navigate(['/adesioni'], { relativeTo: this.route });
    }
    if(event.action == 'download_scheda') {
      this._downloadSchedaAdesione();
    }
    if(event.action == 'comunicazioni') {
      this.router.navigate(['comunicazioni'], { relativeTo: this.route });
    }
  }

  _loadAll() {
    this._loadAdesione();
  }

  _isDominioEsterno: boolean = false;
  _idDominioEsterno: string | null = null;
  _idSoggettoDominioEsterno: string | null = null;

  _loadServizio(id: string | null, disable = false) {
    this.apiService.getDetails('servizi', id).subscribe((serv) => {
      this._servizio = serv;

      this._isDominioEsterno = this._servizio.dominio?.soggetto_referente?.organizzazione?.esterna || false;
      this._idDominioEsterno = this._servizio.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
      this._idSoggettoDominioEsterno = this._servizio.dominio?.soggetto_referente?.id_soggetto || null;
      // this._formGroup.get('id_soggetto')?.setValue(this._idSoggettoDominioEsterno);

      this._initServiziSelect([{'id_servizio': serv.id_servizio, 'nome': serv.nome, 'versione': serv.versione}]);

      if (disable) { this._formGroup.get('id_servizio')?.disable(); }
      if (this._servizio.multi_adesione) {
        this._formGroup.get('id_logico')?.setValidators([Validators.required]);
      } else {
        this._formGroup.get('id_logico')?.clearValidators();
      }
      this._formGroup.get('id_logico')?.updateValueAndValidity();

      this._showMandatoryFields(this._formGroup.controls);
    });
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  _isVisibilita(type: string) {
    return (this.f['visibilita'] && this.f['visibilita'].value === type);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'id_servizio':
            value = data[key] ? data[key] : null;
            if (this._isWeb) {
              _group[key] = new FormControl({ value: value, disabled: true }, [Validators.required]);
            } else {
              _group[key] = new FormControl(value, [Validators.required]);
            }
            break;
          case 'referente_tecnico':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, []);
            break;
          case 'referente':
            value = data[key] ? data[key] : null;
            const _referente_obbligatorio = this.generalConfig?.adesione.referente_obbligatorio || false;
            _group[key] = new FormControl(value, (this._isNew &&_referente_obbligatorio) ? [Validators.required] : []);
            break;
          case 'servizio_nome':
          case 'soggetto_nome':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl({ value: value, disabled: true }, []);
            break;
          case 'id_organizzazione':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl({ value: value, disabled: !!value }, [Validators.required]);
            break;
          case 'data_creazione':
          case 'data_ultimo_aggiornamento':
            const _now = moment().format('DD-MM-YYYY HH:mm:ss');
            value = data[key] ? moment(data[key]).format('DD-MM-YYYY HH:mm:ss') : _now;
            _group[key] = new FormControl({ value: value, disabled: true }, []);
            break;
          case 'id_logico':
            // if (this.generalConfig?.servizio.adesioni_multiple == true) {
            //   value = data[key] ? data[key] : null;
            //   _group[key] = new FormControl(value, [Validators.required]);
            // } else {
              value = data[key] ? data[key] : null;
              _group[key] = new FormControl(value, []);
            // }
            break;
          case 'id_soggetto':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [Validators.required]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, []);
            break;
        }
      });

      this._formGroup = new FormGroup(_group);

      this.updateIdLogico(this._servizio);

      this._showMandatoryFields(data);
    }
  }

  _showMandatoryFields(data: any) {
    if (this.debugMandatoryFields) {
      console.group('_showMandatoryFields');
      Object.keys(data).forEach((key) => {
        if (this._formGroup.controls[key].hasValidator(Validators.required))
          console.log(key, this._formGroup.controls[key].value);
        // console.log(key, this._formGroup.controls[key].hasValidator(Validators.required))
      });
      console.groupEnd();
    }
  }

  _prepareBodySaveAdesione(body: any) {
    if (this._isWeb) {
      body.id_servizio = this._id_servizio;
    }

    const _newBody: any = {
      id_soggetto: body.id_soggetto || this._disabled_id_soggetto,
      id_servizio: body.id_servizio,
      id_logico: body.id_logico || null,
    };

    _newBody.referenti = [];

    if (body.referente) {
      _newBody.referenti.push({ id_utente: body.referente, tipo: 'referente' });
    }

    if (body.referente_tecnico) {
      _newBody.referenti.push({ id_utente: body.referente_tecnico, tipo: 'referente_tecnico' });
    }

    _newBody.referenti.length > 0 ? null : _newBody.referenti = null;

    this._removeNullProperties(_newBody);

    return _newBody;
  }

  _prepareBodyUpdateAdesione(body: any) {
    const _newBody: any = {
      identificativo: {
        id_logico: body.id_logico || null,
        id_soggetto: body.id_soggetto || this._disabled_id_soggetto,
        id_servizio: body.id_servizio || null,
      },
      stato: body.stato
    };

    if(this._id_servizio){
      _newBody.identificativo.id_servizio = this._id_servizio;
    }

    this._removeNullProperties(_newBody.identificativo);
    return _newBody;
  }

  _onServiceLoaded(event: any, field: string) {
    this._selectedSubscription = event.target.subscriptions[0];
  }

  __onSave(body: any) {
    this._error = false;
    
    const _body = this._prepareBodySaveAdesione(body);

    this._spin = true;

    this.apiService.saveElement(this.model, _body).subscribe(
      (response: any) => {
        this.id = response.id_adesione;
        this.adesione = response; // new Adesione({ ...response });
        this._adesione = new Adesione({ ...response });

        this._isEdit = false;
        this._isNew = false;
        this._initBreadcrumb();
        
        this._initServiziSelect([]);
        this._initSoggettiSelect([]);
        this._initOrganizzazioniSelect([]);
        this._initReferentiSelect([]);
        this._initReferentiTecniciSelect([]);
        this.router.navigate([this.id], { replaceUrl: true, relativeTo: this.route.parent });
        this._spin = false;
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  __onUpdate(id: string, body: any) {
    this._error = false;
    
    const _body = this._prepareBodyUpdateAdesione(body);

    this._spin = true;
    if (_body) {
      this.apiService.putElement(this.model, id, _body).subscribe(
        (response: any) => {
          this._isEdit = !this._closeEdit;
          this.adesione = response;
          this._adesione = new Adesione({ ...response });
          this.id = this.adesione.id_adesione;
          this._spin = false;
          this.save.emit({ id: this.id, payment: response, update: true });
        },
        (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
          this._spin = false;
        }
      );
    } else {
      console.log('No difference');
    }
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else { 
        this.__onUpdate(this.adesione.id_adesione, form);
      }
    }
  }

  _deleteService() {
    const initialState = {
      title: this.translate.instant('APP.TITLE.Attention'),
      messages: [
        this.translate.instant('APP.MESSAGE.AreYouSure')
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this.apiService.deleteElement(this.model, this.adesione.id).subscribe(
            (response) => {
              this.save.emit({ id: this.id, subscription: response, update: false });
            },
            (error) => {
              this._error = true;
              this._errorMsg = Tools.GetErrorMsg(error);
            }
          );
        }
      }
    );
  }

  trackByFn(item: any) {
    return item.id;
  }

  getServizi(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, 'adesione_consentita': true } };
    return this.apiService.getList('servizi', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  getSoggetti(term: string | null = null): Observable<any> {
    const id_organizzazione: any = this._formGroup.get('id_organizzazione')?.value;
    let _options: any = null;
    if (term == null) {
      _options = { params: { id_organizzazione: id_organizzazione, 'aderente': true } };
    } else {
      _options = { params: { q: term, id_organizzazione: id_organizzazione, 'aderente': true } };
    }
    return this.apiService.getList('soggetti', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, 'soggetto_aderente' : true } };
    return this.apiService.getList('organizzazioni', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  getDomini(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('domini', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  getUtenti(term: string | null = null, org: string | null = null, stato: string = 'abilitato', referenteTecnico: boolean = false): Observable<any> {
    const _options: any = { params: { q: term } };
    if (org) { _options.params.id_organizzazione = org; }
    if (stato) { _options.params.stato = stato; }
    if (referenteTecnico) { _options.params.referente_tecnico = referenteTecnico; }

    return this.apiService.getList('utenti', _options)
      .pipe(
        map(resp => {
          if (resp.Error) {
            throwError(resp.Error);
          } else {
            const _items = resp.content.map((item: any) => {
              item.nome_completo = `${item.nome} ${item.cognome}`;
                return item;
            });
            return _items;
          }
        })
      );
  }

  _loadProfilo(spin: boolean = true) {
    this._profilo = this.authenticationService.getCurrentSession();
    console.log('_loadProfilo', this._profilo);
    const _ruolo: string | null = this._profilo?.utente.ruolo || null;

    if (this._scelta_libera_organizzazione) {
      this._initOrganizzazioniSelect([]);
    } else {

      if (_ruolo == 'gestore' || !this._profilo?.utente.organizzazione) {
        this._initOrganizzazioniSelect([]);
      } else {
        this._loadOrganizzazione(this._profilo?.utente.organizzazione.id_organizzazione);
      }
    }
  }

  _loadAdesione(spin: boolean = true) {
    if (this.id) {
      this._spin = spin;
      if(spin) { this.adesione = null; }

      this.apiService.getDetails(this.model, this.id, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;
          console.log('grant', this._grant);
          this.apiService.getDetails(this.model, this.id).subscribe({
            next: (response: any) => {
              this.adesione = response; // new Service({ ...response });
              
              this._isBozza = (this.adesione.stato == 'bozza');

              this._adesione = new Adesione({ ...response });
              
              this._adesione.servizio = response.servizio.servizio;
              this._adesione.id_servizio = response.servizio.id_servizio;
              this._adesione.servizio_nome = response.servizio.nome;
              
              this._adesione.soggetto = response.soggetto.soggetto;
              this._adesione.id_soggetto = response.soggetto.id_soggetto;
              this._adesione.soggetto_nome = response.soggetto.nome;

              this._adesione.organizzazione = response.soggetto.organizzazione;
              this._adesione.id_organizzazione = response.soggetto.organizzazione.id_organizzazione;
              this._adesione.organizzazione_nome = response.soggetto.organizzazione.nome;

              this._initForm({ ...this._adesione });

              // Non più necessaria con soggetto di default
              this.getSoggetti().subscribe(
                (result) => {
                  this._elencoSoggetti = [...result];

                  const controls = this._formGroup.controls;
                  if (result.length == 1) {
                    this._hideSoggettoDropdown = true;
                    this._hideSoggettoInfo = true;
                  } else {
                    this._hideSoggettoDropdown = false;
                    this._hideSoggettoInfo = false;
                    this._elencoSoggetti = [...result];
                    this._formGroup.controls.id_soggetto.patchValue(this.adesione.soggetto.id_soggetto)
                    this._formGroup.controls.id_soggetto.updateValueAndValidity()
                    this._formGroup.updateValueAndValidity();
                  }
                },
                (error: any) => {
                  Tools.OnError(error);
                  this._spin = false;
                }
              );

              this._spin = false;

              this._loadServizio(this._adesione.id_servizio);

              this._initBreadcrumb();
              this._updateOtherActions();
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _updateOtherActions() {
    const _canJoin = this.authenticationService.canJoin('adesione', this.adesione?.stato);

    const _otherActions = this._otherActions.map((item: any) => {
      let _enabled = true;
      switch (item.action) {
        case 'download_scheda':
          _enabled = _canJoin;
          break;
        default:
          if (item.type === 'divider') {
            _enabled = _canJoin;
          }
      }
      return { ...item, enabled: _enabled };
    });
    this._otherActions = Object.assign([], _otherActions);
  }

  _loadOrganizzazione(id: string) {
    const _options: any = { params: { id_organizzazione: `${id}` } };
    this.apiService.getList('soggetti', _options).subscribe({
      next: (response: any) => {
          this._orgAppartenenzaUtente = response.content[0];
          const aux: any = {
            id_organizzazione: this._orgAppartenenzaUtente.organizzazione.id_organizzazione,
            nome: this._orgAppartenenzaUtente.organizzazione.nome,
          }

          this.ngSelectOrganizazione?.handleClearClick();
          this._formGroup.get('id_organizzazione')?.disable();
          this._initOrganizzazioniSelect([aux]);

          setTimeout(() => {
            this._formGroup.patchValue({id_organizzazione: this._orgAppartenenzaUtente.organizzazione.id_organizzazione});
            this._checkSoggetto(this._orgAppartenenzaUtente);
          }, 10);
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
    });
  }

  updateIdLogico(servizio: any) {
    if (this._servizio) {
      if (this._servizio.multi_adesione) {
        this._formGroup.get('id_logico')?.setValidators([Validators.required]);
      } else {
        this._formGroup.get('id_logico')?.clearValidators();
      }
      this._formGroup.get('id_logico')?.updateValueAndValidity();
    }
  }

  _initServiziSelect(defaultValue: any[] = []) {
    this.servizi$ = concat(
      of(defaultValue),
      this.serviziInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.serviziLoading = true),
        switchMap((term: any) => {
          return this.getServizi(term).pipe(
            catchError(() => of([])),
            tap(() => this.serviziLoading = false)
          )
        })
      )
    );
  }

  _initSoggettiSelect(defaultValue: any[] = []) {
    this.soggetti$ = concat(
      of(defaultValue),
      this.soggettiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.soggettiLoading = true),
        switchMap((term: any) => {
          return this.getSoggetti(term).pipe(
            catchError(() => of([])),
            tap(() => this.soggettiLoading = false)
          )
        })
      )
    );
  }

  _initOrganizzazioniSelect(defaultValue: any[] = []) {
    this.organizzazioni$ = concat(
      of(defaultValue),
      this.organizzazioniInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.organizzazioniLoading = true),
        switchMap((term: any) => {
          return this.getOrganizzazioni(term).pipe(
            catchError(() => of([])),
            tap(() => this.organizzazioniLoading = false)
          )
        })
      )
    );
  }

  _initReferentiSelect(defaultValue: any[] = []) {
    
    this.referenti$ = concat(
      of(defaultValue),
      this.referentiInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.referentiLoading = true),
        switchMap((term: any) => {
          return this.getUtenti(term, this._formGroup.controls.id_organizzazione.value).pipe(
            catchError(() => of([])),
            tap(() => this.referentiLoading = false)
          )
        })
      )
    );
  }

  _initReferentiTecniciSelect(defaultValue: any[] = []) {
    this.referentiTecnici$ = concat(
      of(defaultValue),
      this.referentiTecniciInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.referentiTecniciLoading = true),
        switchMap((term: any) => {
          return this.getUtenti(term, null, 'abilitato', true).pipe(
            catchError(() => of([])),
            tap(() => this.referentiTecniciLoading = false)
          )
        })
      )
    );
  }

  _initBreadcrumb() {
    const _organizzazione: string = this.adesione ? this.adesione.soggetto.organizzazione.nome : null;
    const _servizio: string = this.adesione ? this.adesione.servizio.nome : null;
    const _versione: string = this.adesione ? this.adesione.servizio.versione : null;

    let title = this.adesione ? `${_organizzazione} - ${_servizio} v. ${_versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    let baseUrl = `/${this.model}`;

    if (this._serviceBreadcrumbs) {
      title = this.id ? _organizzazione : title;
      baseUrl = `/servizi/${this._serviceBreadcrumbs.service.id_servizio}/${this.model}`;
    }

    this.breadcrumbs = [
      { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
      { label: title, url: ``, type: 'link' }
    ];

    if(this._serviceBreadcrumbs){
      this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
    }
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _editAdesione() {
    
    this._isBozza = (this.adesione.stato == 'bozza');

    this._adesioneUpdate.id_logico = this.adesione.id_logico;
    this._adesioneUpdate.stato = this.adesione.stato;
    this._adesioneUpdate.servizio = this.adesione.servizio;
    this._adesioneUpdate.organizzazione = this.adesione.soggetto.organizzazione;
    this._adesioneUpdate.soggetto = this.adesione.soggetto;
    this._adesioneUpdate.id_servizio = this.adesione.servizio.id_servizio;
    this._adesioneUpdate.id_organizzazione = this.adesione.soggetto.organizzazione.id_organizzazione;
    this._adesioneUpdate.id_soggetto = this.adesione.soggetto.id_soggetto;

    this._initForm({ ...this._adesioneUpdate });
    this._initServiziSelect([this._adesioneUpdate.servizio]);
    this._initSoggettiSelect([this._adesioneUpdate.soggetto]);
    this._initOrganizzazioniSelect([this._adesioneUpdate.organizzazione]);

    this._isEdit = true;
    this._error = false;
  }

  _checkSoggetto(event: any) {
    if(event) {
      this.selectedOrganizzazione = event;
      console.log('_checkSoggetto selectedOrganizzazione', this.selectedOrganizzazione);
      this.getSoggetti().subscribe(
        (result) => {
          const controls = this._formGroup.controls;
          console.log('_checkSoggetto result', result);
          if (result.length === 1) {
            this._hideSoggettoDropdown = true;

            let aux: Soggetto = {
              aderente: result[0].aderente,
              id_soggetto: result[0].id_soggetto,
              nome: result[0].nome,
              organizzazione: result[0].organizzazione,
              referente: result[0].referente,
            }
            this._initSoggettiSelect([aux]);
            controls.id_soggetto.patchValue(aux.id_soggetto);
            controls.soggetto_nome.patchValue(aux.nome);
            controls.id_soggetto.disable();
            controls.referente.enable();
            this._disabled_id_soggetto = aux.id_soggetto;
            console.log('_checkSoggetto aux', aux);
          } else {

            this._elencoSoggetti = [...result];

            if (this.selectedOrganizzazione?.soggetto_default) {
              controls.id_soggetto.patchValue(this.selectedOrganizzazione?.soggetto_default.id_soggetto);
              controls.soggetto_nome.patchValue(this.selectedOrganizzazione?.soggetto_default.nome);
              controls.id_soggetto.updateValueAndValidity();
              controls.soggetto_nome.updateValueAndValidity();
            }
            controls.referente.enable();
            controls.id_soggetto.enable();
            controls.referente.updateValueAndValidity();
            controls.id_soggetto.updateValueAndValidity();
            this._disabled_id_soggetto = null;
            this._hideSoggettoDropdown = true;
          }

          this._initReferentiSelect([]);
          controls.referente.patchValue(null);

          this._formGroup.updateValueAndValidity();
          this._showMandatoryFields(this._formGroup.controls);
        },
        (err) => console.log(err)
      );
      
    } else {

      const controls = this._formGroup.controls;
      controls.id_soggetto.setValue(this._idSoggettoDominioEsterno);
      controls.referente.patchValue(null);
      this._initSoggettiSelect([]);
      this._initReferentiSelect([]);
      this._formGroup.updateValueAndValidity();

      this._elencoSoggetti = [];
      this._hideSoggettoDropdown = true;
    }
  }

  _onChangeSoggetto(event: any) {
    console.log('_onChangeSoggetto', event)
  }

  async _onChangeServizio(servizio?: Servizio) {
    this._servizio = servizio;
    this._isDominioEsterno = this._servizio?.dominio?.soggetto_referente?.organizzazione?.esterna || false;
    this._idDominioEsterno = this._servizio?.dominio?.soggetto_referente?.organizzazione?.id_organizzazione || null;
    this._idSoggettoDominioEsterno = this._servizio?.dominio?.soggetto_referente?.id_soggetto || null;

    // console.group('_onChangeServizio');
    // console.log('_servizio', this._servizio);
    // console.log('_isDominioEsterno', this._isDominioEsterno);
    // console.log('_idDominioEsterno', this._idDominioEsterno);
    // console.log('_idSoggettoDominioEsterno', this._idSoggettoDominioEsterno);
    // console.log('_profilo', this._profilo);
    // console.groupEnd();

    this.updateIdLogico(this._servizio);
    
    if (this._isDominioEsterno) {
      const _organizzazione = this._servizio.soggetto_interno?.organizzazione;
      this._idDominioEsterno = _organizzazione?.id_organizzazione || null;
      this._idSoggettoDominioEsterno = this._servizio.soggetto_interno?.id_soggetto || null;
      this._formGroup.get('id_organizzazione')?.setValue(this._idDominioEsterno);
      this._formGroup.get('id_organizzazione')?.disable();
      this._formGroup.get('id_soggetto')?.setValue(this._idSoggettoDominioEsterno);
      this._formGroup.get('id_soggetto')?.disable();
      this._hideSoggettoDropdown = true;
      this._initOrganizzazioniSelect([_organizzazione]);
    } else {
      if (this._profilo?.utente.ruolo === RuoloUtenteEnum.ReferenteServizio){
        if (servizio && await this.isCurrentUserReferenteServizio(servizio)){
          this._formGroup.get('id_organizzazione')?.enable();
          this._formGroup.get('id_organizzazione')?.reset();
          this.ngSelectOrganizazione?.handleClearClick();
        } else {
          if (this._profilo.utente.organizzazione) {
            this._loadOrganizzazione(this._profilo.utente.organizzazione.id_organizzazione);
          }
        }
      }
    }

    this._showMandatoryFields(this._formGroup.controls);
  }

  _onChangeIdLogico(event: any) {
    this._showMandatoryFields(this._formGroup.controls);
  }

  _checkOrganizzazione(event: any) {
    const controls = this._formGroup.controls;
    if (event) {
      controls.id_organizzazione.enable();
      controls.id_organizzazione.updateValueAndValidity();
    } else {
      controls.id_organizzazione.patchValue(null);
      controls.id_soggetto.patchValue(null);
    }
    this._formGroup.updateValueAndValidity();
  }

  _onClose() {
    this.close.emit({ id: this.id, subscription: this._adesione });
  }

  _onSave() {
    this.save.emit({ id: this.id, subscription: this._adesione });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.location.back();
      } else {
        this.close.emit({ id: this.id, subscription: null });
      }
    } else {
      this._adesione = new Adesione({ ...this.adesione });
    }
  }

  _onEditComponent(event: any, component: any) {
    console.log('_onEditComponent', component);
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

  onWorkflowAction(event: any) {
    this.utils.__confirmCambioStatoServizio(event, this.adesione, this._changeStatus.bind(this));
  }

  _changeStatus(event: any, service: any) {
    this._changingStatus = true;
    const _url: string = `${this.model}/${this.id}/stato`;
    const _body: any = {
      stato: event.status.nome
    };
    this.apiService.saveElement(_url, _body).subscribe(
      (response: any) => {
        this.adesione = response; // new Service({ ...response });
        this._adesione = new Adesione({ ...response });
        
        this._adesione.servizio_nome = response.servizio.nome;
        this._adesione.soggetto_nome = response.soggetto.nome;

        this._changingStatus = false;
        const _status: string = this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato);
        const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusSuccess', {status: _status});
        Tools.showMessage(_msg, 'success', true);
        this._updateMapper = new Date().getTime().toString();
      },
      (error: any) => {
        this._changingStatus = false;
        this._error = true;
        this._errorMsg = Tools.WorkflowErrorMsg(error);
        this._errors = error.error.errori || [];
        this._fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + this.adesione.stato);
        this._toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + event.status.nome);
        const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', {status: this._toStatus});
        Tools.showMessage(_msg, 'danger', true);
        this._updateMapper = new Date().getTime().toString();
      },
    );
  }

  _downloadSchedaAdesione() {
    if (this.id) {
      this._downloading = true;

      const _partial = `export`;
      this.apiService.download(this.model, this.id, _partial).subscribe({
        next: (response: any) => {
          // const _ext = data.filename.split('/')[1];
          // let name: string = `${data.filename}.${_ext}`;
          let name: string = `SchedaAdesione.pdf`;
          saveAs(response.body, name);
          this._downloading = false;
        },
        error: (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
          this._downloading = false;
        }
      });
    }
  }

  _removeNullProperties(obj: any) {
    Object.keys(obj).forEach((k: string) => {
        obj[k] == null ? delete obj[k] : null;
      })
  }

  _canDownloadSchedaAdesioneMapper = (): boolean => {
    return this.authenticationService.canDownloadSchedaAdesione(this.adesione?.stato);
  }

  _canEditMapper = (): boolean => {
    return this.authenticationService.canEdit('adesione', 'adesione', this.adesione?.stato, this._grant?.ruoli);
  }

  private async isCurrentUserReferenteServizio(servizio: Servizio){
    const referenti = await this.getReferentiServizio(servizio);
    return referenti.some(referente => referente.utente.id_utente === this._profilo?.utente.id_utente);
  }

  private async getReferentiServizio(servizio: Servizio):Promise<{utente: Utente, tipo: string}[]>{
    const result = await this.apiService.getList(`servizi/${servizio.id_servizio}/referenti`, {params: {tipo_referente: 'referente'}}).toPromise()
    return result.content;
  }

  _onCloseNotificationBar(event: any) {
    this.router.navigate([this.model, this.id]);
  }
}
