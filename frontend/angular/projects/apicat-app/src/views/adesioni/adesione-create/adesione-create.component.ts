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
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ReactiveFormsModule, FormsModule, AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { NgSelectComponent, NgSelectModule } from '@ng-select/ng-select';

import { COMPONENTS_IMPORTS, ConfigService, Tools, EventsManagerService, EventType } from '@linkit/components';
import { MarkAsteriskDirective } from '@app/directives/mark-asterisk/mark-asterisk.directive';
import { ErrorViewComponent } from '@app/components/error-view/error-view.component';

import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService, RUOLI_ORG_REFERENTE } from '@app/services/utils.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { Adesione } from '../adesione-details/adesione';
import { AdesioneCreate } from '../adesione-details/adesioneCreate';
import { Servizio, Soggetto } from '../adesione-details/adesioneUpdate';
import { AdesioneFasiBarComponent } from '../adesione-fasi-bar/adesione-fasi-bar.component';
import { StepWizardItem } from '../adesione-step-bar/adesione-step-bar.component';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

import moment from 'moment';
import { Utente } from '@app/model/utente';
import { Profilo } from '@app/model/profilo';
import { Ruolo } from '@app/views/utenti/utente-details/utente';
import { ServiceBreadcrumbsData } from '@app/views/servizi/route-resolver/service-breadcrumbs.resolver';

/**
 * Form di creazione adesione (FASE 0 wizard-like). Componente dedicato
 * alla sola creazione (rotta `adesioni/new/edit` e child
 * `servizi/:id/adesioni/new/edit`): non gestisce edit/view/workflow di
 * un'adesione esistente. La logica della form (FormGroup, select con
 * typeahead, dominio esterno, scelta libera organizzazione, self-referente,
 * payload `POST /adesioni`) e` quella del flusso "new" di `adesione-details`.
 */
@Component({
  selector: 'app-adesione-create',
  templateUrl: 'adesione-create.component.html',
  styleUrls: ['adesione-create.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TranslateModule,
    ...COMPONENTS_IMPORTS,
    MarkAsteriskDirective,
    ErrorViewComponent,
    NgSelectModule,
    TooltipModule,
    AdesioneFasiBarComponent
  ]
})
export class AdesioneCreateComponent implements OnInit {
  static readonly Name = 'AdesioneCreateComponent';
  readonly model: string = 'adesioni';

  @ViewChild('ngSelectOrganizazione', {read: NgSelectComponent}) ngSelectOrganizazione: NgSelectComponent|null = null;

  id: any = null;
  adesione: any = null;

  _isEdit = false;
  _isNew = false;
  _isSelfReferente: boolean = true;
  _formGroup: FormGroup = new FormGroup({});
  _adesione: Adesione = new Adesione({});
  _adesioneCreate: AdesioneCreate = new AdesioneCreate({});

  _spin: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Subscriptions', url: '', type: 'title', iconBs: 'display' },
    { label: '...', url: '', type: 'title' }
  ];

  _error: boolean = false;
  _errorMsg: string = '';
  _errors: any[] = [];

  servizi$!: Observable<any[]>;
  serviziInput$ = new Subject<string>();
  serviziLoading: boolean = false;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;
  selectedOrganizzazione: any;

  referenti$!: Observable<any[]>;
  referentiInput$ = new Subject<string>();
  referentiLoading: boolean = false;

  referentiTecnici$!: Observable<any[]>;
  referentiTecniciInput$ = new Subject<string>();
  referentiTecniciLoading: boolean = false;

  minLengthTerm = 1;

  generalConfig: any = Tools.Configurazione || null;

  _profilo: Profilo|null = null;
  _orgAppartenenzaUtente: any = null;

  _disabled_id_soggetto: any = null;

  _id_servizio: any = null;
  _servizio: any = null;
  _isWeb: boolean = false;

  /**
   * Barra fasi statica a 3 step mostrata in cima alla form di creazione.
   * La creazione coincide con la FASE 1 ("Informazioni Generali e
   * Referenti"): durante la compilazione e` `current` (rossa), le altre 2
   * (Collaudo, Produzione) sono `pending` (lucchetto, non cliccabili)
   * perche` il workflow vero parte solo dopo il salvataggio. A salvataggio
   * riuscito la FASE 1 risulta completata nel wizard di destinazione.
   * `numberOffset=1` (default) -> numerazione "FASE 1..3".
   */
  readonly _fasiBarSteps: StepWizardItem[] = [
    { code: 'info_referenti', descrizione: 'Informazioni Generali e Referenti', stati_adesione: ['creazione'] },
    { code: 'collaudo', descrizione: 'Collaudo', stati_adesione: [] },
    { code: 'produzione', descrizione: 'Produzione', stati_adesione: [] }
  ];
  readonly _fasiCurrent = 'creazione';

  /** Visualizzazione opzionale della barra fasi in cima alla form di
   *  creazione. Pilotata da app-config (`AppConfig.Adesioni.showCreateFasiBar`);
   *  default `true` (barra visibile) se la chiave non e` presente. */
  _showFasiBar: boolean = true;

  _hideSoggettoDropdown: boolean = true;
  _elencoSoggetti: any[] = [];

  _scelta_libera_organizzazione: boolean = false;

  _serviceBreadcrumbs: ServiceBreadcrumbsData|null = null;

  _fromDashboard: boolean = false;
  _dashboardSection: string = '';

  /** Quando valorizzato, l'organizzazione e` bloccata sul contesto
   * di sessione e nel template si rende un input testuale read-only
   * al posto del ng-select (evita problemi di bind ng-select +
   * patchValue + disabled durante creazione adesione). */
  _lockedOrgNome: string = '';

  debugMandatoryFields: boolean = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService,
    private readonly location: Location
  ) {
    const _appConfig = this.configService.getConfiguration();
    this._showFasiBar = _appConfig?.AppConfig?.Adesioni?.showCreateFasiBar ?? true;

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
  }

  ngOnInit() {
    localStorage.setItem('ADESIONI_VIEW', 'FALSE');

    this._scelta_libera_organizzazione = this.generalConfig?.adesione.scelta_libera_organizzazione || false;

    this.route.params.subscribe(() => {
      this._initBreadcrumb();

      this.configService.getConfig(this.model).subscribe(() => {
        this._isNew = true;
        this._initForm({ ...this._adesioneCreate });
        this._initSoggettiSelect([]);
        this._initOrganizzazioniSelect([]);
        this._initReferentiSelect([]);
        if (!this._id_servizio) {
          this._initServiziSelect([]);
        }
        this._initReferentiTecniciSelect([]);
        setTimeout(() => {
          this._onChangeServizio(this._servizio);
        }, 900);

        this._loadProfilo();
        this._isEdit = true;
        this._spin = false;
      });
    });

    this.route.queryParams.subscribe((val) => {
      if (val.from === 'dashboard') {
        this._fromDashboard = true;
        this._dashboardSection = val.section || '';
        this._initBreadcrumb();
      }

      if (val.id_servizio) {
        this._id_servizio = val.id_servizio;
        this._adesioneCreate.id_servizio = this._id_servizio;
        this._isWeb = val.web || false;
        this._loadServizio(this._id_servizio);
      }
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, () => {
      this.generalConfig = Tools.Configurazione || null;
      this._scelta_libera_organizzazione = this.generalConfig?.adesione.scelta_libera_organizzazione || false;
      this._initForm(this._adesioneCreate);
    });
  }

  _loadServizio(id: string | null, disable = false) {
    this.apiService.getDetails('servizi', id).subscribe((serv) => {
      this._servizio = serv;

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
    return !!(this.f[name]?.errors && this.f[name]?.touched);
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
          case 'referente':{
            value = data[key] ? data[key] : null;
            const _referente_obbligatorio = this.generalConfig?.adesione.referente_obbligatorio || false;
            _group[key] = new FormControl(value, (this._isNew &&_referente_obbligatorio) ? [Validators.required] : []);
            break;
          }
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
          case 'data_ultimo_aggiornamento':{
            const _now = moment().format('DD-MM-YYYY HH:mm:ss');
            value = data[key] ? moment(data[key]).format('DD-MM-YYYY HH:mm:ss') : _now;
            _group[key] = new FormControl({ value: value, disabled: true }, []);
            break;
          }
          case 'id_logico':
          case 'id_soggetto':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [Validators.required]);
            break;
          case 'referente_tecnico':
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
        const ctrl = this._formGroup.controls[key];
        if (ctrl.hasValidator(Validators.required)) {
          console.log(`${key}: value=${JSON.stringify(ctrl.value)}, disabled=${ctrl.disabled}, invalid=${ctrl.invalid}, status=${ctrl.status}`);
        }
      });
      console.log(`FORM valid=${this._formGroup.valid}, invalid=${this._formGroup.invalid}, status=${this._formGroup.status}`);
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

    if (this._isSelfReferente) {
      const currentUser = this.authenticationService.getUser();
      if (currentUser?.id_utente) {
        _newBody.referenti.push({ id_utente: currentUser.id_utente, tipo: 'referente' });
      }
    } else if (body.referente) {
      _newBody.referenti.push({ id_utente: body.referente, tipo: 'referente' });
    }

    if (body.referente_tecnico) {
      _newBody.referenti.push({ id_utente: body.referente_tecnico, tipo: 'referente_tecnico' });
    }

    if (_newBody.referenti.length === 0) {
      _newBody.referenti = null;
    }

    this._removeNullProperties(_newBody);

    return _newBody;
  }

  __onSave(body: any) {
    this._error = false;

    const _body = this._prepareBodySaveAdesione(body);

    this._spin = true;

    this.apiService.saveElement(this.model, _body).subscribe({
      next: (response: any) => {
        this.id = response.id_adesione;
        this.adesione = response;
        this._adesione = new Adesione({ ...response });

        this._isEdit = false;
        this._isNew = false;
        this._initBreadcrumb();

        this.router.navigate([this.id], { replaceUrl: true, relativeTo: this.route.parent });
        this._spin = false;
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    });
  }

  _onSubmit(form: any) {
    if (this._isEdit && this._formGroup.valid) {
      this.__onSave(form);
    }
  }

  getServizi(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, 'adesione_consentita': true } };
    return this.apiService.getList('servizi', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(() => resp.Error);
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
        if (resp?.Error) {
          throwError(() => resp.Error);
        } else {
          return resp?.content || [];
        }
      })
      );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, 'soggetto_aderente' : true } };
    return this.apiService.getList('organizzazioni', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(() => resp.Error);
        } else {
          const _items = resp.content.map((item: any) => {
            return item;
          });
          return _items;
        }
      })
      );
  }

  getUtenti(term: string | null = null, org: string | null = null, stato: string = 'abilitato', ruoliOrganizzazione: string[] = []): Observable<any> {
    const _options: any = { params: { q: term } };
    if (org) {
      _options.params.id_organizzazione = org;
      // Issue #284: `ruolo_organizzazione` solo con id_organizzazione (vincolo BE).
      if (ruoliOrganizzazione?.length) { _options.params.ruolo_organizzazione = ruoliOrganizzazione; }
    }
    if (stato) { _options.params.stato = stato; }

    return this.apiService.getList('utenti', _options)
      .pipe(
        map(resp => {
          if (resp.Error) {
            throwError(() => resp.Error);
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

  _loadProfilo() {
    this._profilo = this.authenticationService.getCurrentSession();
    const _ruolo: string | null = this._profilo?.utente.ruolo || null;
    const currentOrg: any = this.authenticationService.getCurrentOrganization();
    const currentOrgId = currentOrg?.id_organizzazione;

    if (this._scelta_libera_organizzazione || _ruolo == 'gestore' || !currentOrgId) {
      this._lockedOrgNome = '';
      // Quando esiste un'organizzazione di contesto (anche con
      // scelta libera o gestore), seediamo la lista del ng-select
      // con quell'item: senza seed la lista resta vuota finche`
      // l'utente non digita un termine di ricerca, e il valore
      // pre-impostato dal contesto non viene reso a video
      // (ng-select non trova il match per `bindValue` nell'array
      // iniziale vuoto). Lasciamo il control abilitato/editabile.
      const seed = (currentOrg && currentOrgId)
        ? [{ id_organizzazione: currentOrgId, nome: currentOrg.nome }]
        : [];
      this._initOrganizzazioniSelect(seed);
      if (currentOrgId) {
        this._formGroup.patchValue({ id_organizzazione: currentOrgId });
        this._checkSoggetto(currentOrgId);
      }
      return;
    }

    // Auto-select immediato dal contesto di sessione (no API):
    // settiamo il control + disabilitiamo + flag per rendering
    // template come input testo read-only.
    this._lockedOrgNome = currentOrg.nome || '';
    this._formGroup.patchValue({ id_organizzazione: currentOrgId });
    this._formGroup.get('id_organizzazione')?.disable();
    this._checkSoggetto(currentOrgId);
  }

  _loadOrganizzazione(id: string) {
    const _options: any = { params: { id_organizzazione: `${id}` } };
    this.apiService.getList('soggetti', _options).subscribe({
      next: (response: any) => {
          // Guard: la lista soggetti per l'organizzazione di sessione
          // puo` essere vuota (utente abilitato all'org senza soggetti
          // associati). In quel caso lasciamo il select libero invece
          // di crashare sull'accesso a `[0].organizzazione`.
          const soggetto = response?.content?.[0];
          const org = soggetto?.organizzazione;
          if (!org?.id_organizzazione) {
            this._initOrganizzazioniSelect([]);
            return;
          }
          this._orgAppartenenzaUtente = soggetto;
          const aux: any = {
            id_organizzazione: org.id_organizzazione,
            nome: org.nome,
          }

          // Race-condition guard: se `_onChangeServizio` ha gia` forzato
          // l'organizzazione (es. servizio con dominio esterno) il control
          // e` `disabled`. In quel caso non sovrascriviamo: il vincolo
          // del servizio prevale sull'auto-select dell'utente.
          const orgCtrl = this._formGroup.get('id_organizzazione');
          if (orgCtrl?.disabled && orgCtrl.value && orgCtrl.value !== org.id_organizzazione) {
            return;
          }

          this.ngSelectOrganizazione?.handleClearClick();
          orgCtrl?.disable();
          this._initOrganizzazioniSelect([aux]);

          setTimeout(() => {
            this._formGroup.patchValue({id_organizzazione: org.id_organizzazione});
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
          return this.getUtenti(term, this._formGroup.controls.id_organizzazione.value, 'abilitato', RUOLI_ORG_REFERENTE).pipe(
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
          return this.getUtenti(term, this._formGroup.controls.id_organizzazione.value, 'abilitato', RUOLI_ORG_REFERENTE).pipe(
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

    if (this.adesione?.id_logico) {
      title = `${title} (${this.adesione.id_logico})`;
    }

    const _dashboardParams = this._dashboardSection ? { section: this._dashboardSection } : null;
    if (this._fromDashboard && !this._serviceBreadcrumbs) {
      this.breadcrumbs = [
        { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams },
        { label: title, url: ``, type: 'link' }
      ];
    } else {
      this.breadcrumbs = [
        { label: 'APP.TITLE.Subscriptions', url: `${baseUrl}/`, type: 'link', iconBs: 'display' },
        { label: title, url: ``, type: 'link' }
      ];

      if(this._serviceBreadcrumbs){
        this.breadcrumbs.unshift(...this._serviceBreadcrumbs.breadcrumbs);
      }
    }
  }

  _checkSoggetto(event: any) {
    if(event) {
      this.selectedOrganizzazione = event;
      this.getSoggetti().subscribe({
        next: (result) => {
          const controls = this._formGroup.controls;
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
          } else {

            this._elencoSoggetti = [...result];

            const _abilitaSelezioneSoggetto = this.generalConfig?.adesione?.abilita_selezione_soggetto ?? false;

            if (_abilitaSelezioneSoggetto && result.length > 1) {
              // Config abilitata e soggetti multipli: mostra il dropdown per permettere la scelta
              this._hideSoggettoDropdown = false;

              // Pre-seleziona soggetto_default se presente
              const _orgObj = this.selectedOrganizzazione?.organizzazione || this.selectedOrganizzazione;
              const _soggettoDefaultPresente = result.some((sog: any) => sog.id_soggetto === _orgObj?.soggetto_default?.id_soggetto);
              if (_soggettoDefaultPresente) {
                controls.id_soggetto.patchValue(_orgObj.soggetto_default.id_soggetto);
                controls.soggetto_nome.patchValue(_orgObj.soggetto_default.nome);
              } else {
                controls.id_soggetto.patchValue(null);
                controls.soggetto_nome.patchValue(null);
              }
            } else {
              // Selezione disabilitata o soggetto singolo: usa soggetto_default se presente
              this._hideSoggettoDropdown = true;
              const _orgObj = this.selectedOrganizzazione?.organizzazione || this.selectedOrganizzazione;
              const _soggettoDefaultPresente = result.some((sog: any) => sog.id_soggetto === _orgObj?.soggetto_default?.id_soggetto);
              if (_soggettoDefaultPresente) {
                controls.id_soggetto.patchValue(_orgObj.soggetto_default.id_soggetto);
                controls.soggetto_nome.patchValue(_orgObj.soggetto_default.nome);
              } else {
                controls.id_soggetto.patchValue(null);
                controls.soggetto_nome.patchValue(null);
              }
            }
            controls.id_soggetto.updateValueAndValidity();
            controls.soggetto_nome.updateValueAndValidity();
            controls.referente.enable();
            controls.id_soggetto.enable();
            controls.referente.updateValueAndValidity();
            controls.id_soggetto.updateValueAndValidity();
            this._disabled_id_soggetto = null;
          }

          this._initReferentiSelect([]);
          controls.referente.patchValue(null);

          this._formGroup.updateValueAndValidity();
          this._showMandatoryFields(this._formGroup.controls);
        },
        error: (err) => console.log(err)
      });

    } else {

      const controls = this._formGroup.controls;
      controls.id_soggetto.setValue(null);
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

    this.updateIdLogico(this._servizio);

    // L'organizzazione dell'adesione (fruitore) e` SEMPRE quella di sessione
    // (impostata da `_loadProfilo`) o scelta dall'utente: non viene mai
    // derivata dal dominio/erogatore del servizio. Per il ruolo
    // referente_servizio carichiamo/abilitiamo l'org corrente.
    if (this._profilo?.utente.ruolo === Ruolo.REFERENTE_SERVIZIO) {
      if (servizio && await this.isCurrentUserReferenteServizio(servizio)) {
        this._formGroup.get('id_organizzazione')?.enable();
        // Se l'organizzazione è già valorizzata (da _loadProfilo), non resettare
        if (!this._formGroup.get('id_organizzazione')?.value) {
          this._initOrganizzazioniSelect([]);
        }
      } else {
        const currentOrgId = this.authenticationService.getCurrentOrganization()?.id_organizzazione;
        if (currentOrgId) {
          this._loadOrganizzazione(currentOrgId);
        }
      }
    }

    this._showMandatoryFields(this._formGroup.controls);
  }

  _onChangeIdLogico(event: any) {
    this._showMandatoryFields(this._formGroup.controls);
  }

  /** Chiusura della form di creazione (bottone X dell'header e
   *  "Annulla" del footer): torna indietro nella history. */
  onCloseCreate(): void {
    this._error = false;
    this._errorMsg = '';
    this.location.back();
  }

  /**
   * Chip di riepilogo del servizio selezionato, mostrati accanto al nome
   * per dare contesto a chi crea l'adesione. Usa solo i campi presenti
   * sul dettaglio servizio (`getDetails('servizi')`): dominio, stato di
   * pubblicazione, visibilita`. Profilo ModI e n. endpoint vivono sulla
   * lista API del servizio (chiamata separata) e restano fuori scope.
   * Getter difensivo: include solo i chip per cui esiste il dato.
   */
  get _servizioChips(): { label: string; icon: string; variant: string }[] {
    const s = this._servizio;
    if (!s) { return []; }
    const chips: { label: string; icon: string; variant: string }[] = [];

    const dominio = s.dominio?.nome || s.dominio?.tag || (typeof s.dominio === 'string' ? s.dominio : null);
    if (dominio) {
      chips.push({ label: dominio, icon: 'bi-diagram-3', variant: 'lnk-pill-muted' });
    }

    if (s.stato) {
      const label = this._tradOrRaw(`APP.WORKFLOW.STATUS.${s.stato}`, s.stato);
      let variant = 'lnk-pill-muted';
      if (s.stato.includes('produzione')) { variant = 'lnk-pill-ok'; }
      else if (s.stato.includes('collaudo')) { variant = 'lnk-pill-info'; }
      chips.push({ label, icon: 'bi-broadcast', variant });
    }

    if (s.visibilita) {
      const isPublic = s.visibilita === 'pubblico';
      chips.push({
        label: this._tradOrRaw(`APP.VISIBILITY.${s.visibilita}`, s.visibilita),
        icon: isPublic ? 'bi-globe' : 'bi-lock',
        variant: isPublic ? 'lnk-pill-muted' : 'lnk-pill-warn'
      });
    }

    return chips;
  }

  /** Traduce `key`; se la chiave non esiste ritorna `raw`. */
  private _tradOrRaw(key: string, raw: string): string {
    const t = this.translate.instant(key);
    return (t && t !== key) ? t : raw;
  }

  onBreadcrumb(event: any) {
    if (event.params) {
      this.router.navigate([event.url], { queryParams: event.params });
    } else {
      this.router.navigate([event.url], { queryParamsHandling: 'preserve' });
    }
  }

  _removeNullProperties(obj: any) {
    Object.keys(obj).forEach((k: string) => {
        if (obj[k] == null) {
          delete obj[k];
        }
      })
  }

  private async isCurrentUserReferenteServizio(servizio: Servizio){
    const referenti = await this.getReferentiServizio(servizio);
    return referenti.some(referente => referente.utente.id_utente === this._profilo?.utente.id_utente);
  }

  private async getReferentiServizio(servizio: Servizio):Promise<{utente: Utente, tipo: string}[]>{
    const result = await this.apiService.getList(`servizi/${servizio.id_servizio}/referenti`, {params: {tipo_referente: 'referente'}}).toPromise()
    return result?.content || [];
  }
}
