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
import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';
import { EventsManagerService, EventType } from '@linkit/components';

import { YesnoDialogBsComponent } from '@linkit/components';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

import { Client, PeriodEnum } from './client';
import { Soggetto } from './client';

import { DatiSpecItem } from './clientUpdate';
import { CommonName } from './clientUpdate';
import { DoubleCert } from './clientUpdate';
import { Datispecifici } from './clientUpdate';

const fake_tipoCertificatoEnum = [ 'fornito', 'richiesto_cn', 'richiesto_csr'];
const fake_stato = [ 'nuovo', 'configurato'];
const fake_ambiente = [ 'collaudo', 'produzione'];

import * as _ from 'lodash';
declare const saveAs: any;

import { Certificato } from '@app/services/utils.service';

@Component({
  selector: 'app-client-details',
  templateUrl: 'client-details.component.html',
  styleUrls: ['client-details.component.scss'],
  standalone: false
})
export class ClientDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'ClientDetailsComponent';
  readonly model: string = 'client';

  @Input() id: number | null = null;
  @Input() client: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  @ViewChild('cambiaStatoTemplate') cambiaStatoTemplate!: any;

  _title: string = '';

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _isDetails = true;

  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _client: Client = new Client({});

  _statoFormGroup: FormGroup = new FormGroup({});

  _descrittoreCtrl: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_generato: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_generato_CSR: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_module: FormControl = new FormControl('', [Validators.required]);

  _descrittoreCtrl_firma: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_generato_firma: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_generato_CSR_firma: FormControl = new FormControl('', [Validators.required]);
  _descrittoreCtrl_module_firma: FormControl = new FormControl('', [Validators.required]);

  _authorizations: any[] = [];

  userProviders: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';
  _errors: any[] = [];
  _fromStatus: string = '';
  _toStatus: string = '';

  _modalConfirmRef!: BsModalRef;
  _modalCambiaStatoRef!: BsModalRef;

  _tipoCertificatoEnum: Array<any> = [];
  _statoEnum: Array<any> = [];
  _ambienteEnum: Array<any> = [];
  _authTypeEnum: Array<any> = [];

  _isFornito: boolean = false; 
  _isRichiesto_cn: boolean = false; 
  _isRichiesto_csr: boolean = false;
  _ip_richiesto: boolean = false;
  _show_erogazione_ip_fruizione: boolean = false;
  _show_erogazione_rate_limiting: boolean = false;
  _show_erogazione_finalita: boolean = false;

  _downloading: boolean = false;
  _deleting: boolean = false;

  _tipoAllegati: string = '';
  
  _isCertificato_generato: boolean = false;
  _certificato_generato: any = {};
  _isCertificato_generato_firma: boolean = false;
  _certificato_generato_firma: any = {};

  _isCertificato_generato_csr: boolean = false;
  _certificato_generato_csr: any = {};
  _isCertificato_generato_csr_firma: boolean = false;
  _certificato_generato_csr_firma: any = {};

  _richiesta: any = {};
  _modulo_richiesta: any = {};
  _certificato_fornito: any = {};
  _certificato_fornito_firma: any = {};
  
  _isFornito_firma: boolean = false; 
  _isRichiesto_cn_firma: boolean = false; 
  _isRichiesto_csr_firma: boolean = false;

  _certificato_csr: any = {};
  _certificato_csr_firma: any = {};
  _modulo_richiesta_csr: any = {};
  _modulo_richiesta_csr_firma: any = {};

  _isAnyCertificateUpdated: boolean = false;

  _auth_type: any = null;

  _isNoDati: boolean = false;
  _isIndirizzoIP: boolean = false;
  _isHttpBasic: boolean = false;
  _isOauthAuthCode: boolean = false;
  _isOauthClientCredentials: boolean = false;
  _isHttps: boolean = false;
  _isHttpsSign: boolean = false;
  _isPdnd: boolean = false;
  _isHttpsPdnd: boolean = false;
  _isHttpsPdndSign: boolean = false;
  _isSign: boolean = false;
  _isSignPdnd: boolean = false;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;
  
  minLengthTerm = 1;

  _isStato_nuovo: boolean = false;

  _hideSoggettoDropdown: boolean = true;
  _elencoSoggetti: any[] = [];

  _isClientUsedInSomeAdesioni: boolean = false;

  ratePeriods: any[] = [
    {'value': PeriodEnum.Giorno, 'label': 'APP.LABEL.Giorno'},
    {'value': PeriodEnum.Ora, 'label': 'APP.LABEL.Ora'},
    {'value': PeriodEnum.Minuti, 'label': 'APP.LABEL.Minuto'}
  ];

  debugMandatoryFields: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    public tools: Tools,
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService,
    private utils: UtilService,
    private eventsManagerService: EventsManagerService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
    this._statoEnum = fake_stato;
    this._ambienteEnum = fake_ambiente;
    if (Tools.Configurazione) {
      Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type));
    }

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.id = params['id'];
        this._initBreadcrumb();
        this._isDetails = true;
        this.configService.getConfig(this.model).subscribe(
          (config: any) => {
            this.config = config;
            this._loadAll();
          }
        );
      } else {
        this._isNew = true;
        this._isEdit = true;
        
        this._initBreadcrumb();
        this._initSoggettiSelect([]);
        this._initOrganizzazioniSelect([]);
        this._initForm({ ...this._client });
        
        this._spin = false;
      }
    });

    this.eventsManagerService.on(EventType.PROFILE_UPDATE, (action: any) => {
      Tools.Configurazione.servizio.api.auth_type.map((item: any) => this._authTypeEnum.push(item.type));
      this.initTipiCertificato();
    });
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.user) {
      const user = changes.user.currentValue;
      this.client = user.source;
      this.id = this.client.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadClient();
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  get fRate(): { [key: string]: AbstractControl } {
    return (this._formGroup.get('rate_limiting') as FormGroup).controls;
  }

  _hasRateControlError(name: string) {
    return (this.fRate[name].errors && this.fRate[name].touched);
  }

  _checkTipoCertificato(auth_type: string = '', tipo_cert: string = '') {
    if ((auth_type == 'https') || (auth_type == 'https_pdnd')) {
      this._isFornito = (tipo_cert == 'fornito')
      this._isRichiesto_cn = (tipo_cert == 'richiesto_cn')
      this._isRichiesto_csr = (tipo_cert == 'richiesto_csr')
    }

    if ((auth_type == 'https_sign') || (auth_type == 'https_pdnd_sign') ) {
      this._isFornito = (tipo_cert == 'fornito')
      this._isRichiesto_cn = (tipo_cert == 'richiesto_cn')
      this._isRichiesto_csr = (tipo_cert == 'richiesto_csr')

      this._isFornito_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'fornito')
      this._isRichiesto_cn_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_cn')
      this._isRichiesto_csr_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_csr')
    }

    if ((auth_type == 'sign') || (auth_type == 'sign_pdnd')) {
      this._isFornito_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'fornito')
      this._isRichiesto_cn_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_cn')
      this._isRichiesto_csr_firma = (this.client.dati_specifici.certificato_firma.tipo_certificato == 'richiesto_csr')
    }
  }

  _initForm(data: any = null) {
    if (data) {
      if (data.dati_specifici) {
        this._checkTipoCertificato(data.dati_specifici?.auth_type, data.dati_specifici?.certificato_autenticazione?.tipo_certificato);
      }

      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'auth_type':
            value = data.dati_specifici?.auth_type ? data.dati_specifici?.auth_type : null;
            _group[key] = new UntypedFormControl({ value: value, disabled: true }, []);
            break;
          case 'finalita':
            value = data.dati_specifici?.finalita || null;
            _group[key] = new UntypedFormControl(value, [Validators.pattern(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i)]);
            break;
          case 'nome':
          case 'ambiente':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });

      _group['rate_limiting'] = new FormGroup({
        quota: new FormControl({value: data?.rate_limiting?.quota || null, disabled: false}),
        periodo: new FormControl({value: data?.rate_limiting?.periodo || PeriodEnum.Giorno, disabled: false}),
      }),

      this._formGroup = new UntypedFormGroup(_group);

      const controls = this._formGroup.controls;

      (controls.stato.value == 'nuovo') ? this._isStato_nuovo = true : this._isStato_nuovo = false;

      if (!this._isNew) {
        controls.id_organizzazione.patchValue(data.soggetto.organizzazione.id_organizzazione)
        controls.id_soggetto.patchValue(data.soggetto.id_soggetto)
      }

      if (this._isFornito) {
        controls.tipo_certificato.patchValue('fornito');
        data ? this._certificato_fornito = data.dati_specifici.certificato_autenticazione.certificato : this._certificato_fornito = null; 
        this._descrittoreCtrl.patchValue(data.dati_specifici.certificato_autenticazione.certificato);
        controls.cert_fornito_filename.patchValue(data.dati_specifici.certificato_autenticazione.certificato.filename);
        controls.cert_fornito_filename.setValidators(Validators.required);
      }

      if (this._isRichiesto_cn) {
        controls.tipo_certificato.patchValue('richiesto_cn');
        data.dati_specifici.certificato_autenticazione?.cn ? controls.cn.patchValue(data.dati_specifici.certificato_autenticazione.cn) : controls.cn.patchValue('') ;
        controls.cn.setValidators(Validators.required);
        if (data.dati_specifici.certificato_autenticazione.certificato){
          data ? this._certificato_generato = data.dati_specifici.certificato_autenticazione.certificato : this._certificato_generato = null;
          this._descrittoreCtrl.patchValue(data.dati_specifici.certificato_autenticazione.certificato);
          controls.cert_generato_filename.patchValue(data.dati_specifici.certificato_autenticazione.certificato.filename);
        }
        if (!this._isStato_nuovo) {
          controls.cert_generato_filename.setValidators(Validators.required);
        }
      }

      if (this._isRichiesto_csr) {
        controls.tipo_certificato.patchValue('richiesto_csr');
        data ? this._certificato_csr = data.dati_specifici.certificato_autenticazione.richiesta : this._certificato_csr = null;
        data ? this._modulo_richiesta_csr = data.dati_specifici.certificato_autenticazione.modulo_richiesta : this._modulo_richiesta_csr = null;
        
        this._descrittoreCtrl.patchValue(data.dati_specifici.certificato_autenticazione.richiesta);
        controls.csr_modulo_ric_filename.patchValue(data.dati_specifici.certificato_autenticazione.richiesta.filename);
        controls.csr_modulo_ric_filename.setValidators(Validators.required);
        
        this._descrittoreCtrl_module.patchValue(data.dati_specifici.certificato_autenticazione.modulo_richiesta);
        controls.csr_richiesta_filename.patchValue(data.dati_specifici.certificato_autenticazione.modulo_richiesta.filename)
        controls.csr_richiesta_filename.setValidators(Validators.required);

        // ------- new CSR --------
        if (data.dati_specifici.certificato_autenticazione.certificato){
          data ? this._certificato_generato_csr = data.dati_specifici.certificato_autenticazione.certificato : this._certificato_generato_csr = null;
          this._descrittoreCtrl_generato_CSR.patchValue(data.dati_specifici.certificato_autenticazione.certificato);
          controls.cert_generato_csr_filename.patchValue(data.dati_specifici.certificato_autenticazione.certificato.filename);
        }
        if (!this._isStato_nuovo) {
          controls.cert_generato_csr_filename.setValidators(Validators.required);
        }
        // ------------------------
      }

      if (this._isFornito_firma) {
        controls.tipo_certificato_firma.patchValue('fornito');
        data ? this._certificato_fornito_firma = data.dati_specifici.certificato_firma.certificato : this._certificato_fornito_firma = null; 
        this._descrittoreCtrl_firma.patchValue(data.dati_specifici.certificato_firma.certificato);
        controls.cert_fornito_filename_firma.patchValue(data.dati_specifici.certificato_firma.certificato.filename);
        controls.cert_fornito_filename_firma.setValidators(Validators.required);    
      }

      if (this._isRichiesto_cn_firma) {
        controls.tipo_certificato_firma.patchValue('richiesto_cn');
        data.dati_specifici.certificato_firma?.cn ? controls.cn_firma.patchValue(data.dati_specifici.certificato_firma.cn) : controls.cn_firma.patchValue('') ;
        controls.cn_firma.setValidators(Validators.required);
        
        if (data.dati_specifici.certificato_firma.certificato) {
          data ? this._certificato_generato_firma = data.dati_specifici.certificato_firma.certificato : this._certificato_generato_firma = null;
          this._descrittoreCtrl_generato_firma.patchValue(data.dati_specifici.certificato_firma.certificato);
          controls.cert_generato_filename_firma.patchValue(data.dati_specifici.certificato_firma.certificato.filename);
        }
        if (!this._isStato_nuovo) {
          controls.cert_generato_filename_firma.setValidators(Validators.required);
        }
      }

      if (this._isRichiesto_csr_firma) {
        controls.tipo_certificato_firma.patchValue('richiesto_csr');
        data ? this._certificato_csr_firma = data.dati_specifici.certificato_firma.richiesta : this._certificato_csr_firma = null;
        data ? this._modulo_richiesta_csr_firma = data.dati_specifici.certificato_firma.modulo_richiesta : this._modulo_richiesta_csr_firma = null;
      
        this._descrittoreCtrl_firma.patchValue(data.dati_specifici.certificato_firma.richiesta);
        controls.csr_modulo_ric_filename_firma.patchValue(data.dati_specifici.certificato_firma.richiesta.filename);
        controls.csr_modulo_ric_filename_firma.setValidators(Validators.required);
        
        this._descrittoreCtrl_module_firma.patchValue(data.dati_specifici.certificato_firma.modulo_richiesta);
        controls.csr_richiesta_filename_firma.patchValue(data.dati_specifici.certificato_firma.modulo_richiesta.filename)
        controls.csr_richiesta_filename_firma.setValidators(Validators.required);

        // ------- new CSR --------
        if (data.dati_specifici.certificato_firma.certificato){
          data ? this._certificato_generato_csr_firma = data.dati_specifici.certificato_firma.certificato : this._certificato_generato_csr_firma = null;
          this._descrittoreCtrl_generato_CSR_firma.patchValue(data.dati_specifici.certificato_firma.certificato);
          controls.cert_generato_csr_filename_firma.patchValue(data.dati_specifici.certificato_firma.certificato.filename);
        }
        if (!this._isStato_nuovo) {
          controls.cert_generato_csr_filename_firma.setValidators(Validators.required);
        }
        // ------------------------
      }

      if (this._isHttpBasic) {
        controls.username.patchValue(data.dati_specifici.username)
        if (!this._isStato_nuovo) {
          controls.username.setValidators(Validators.required);
        }
      }

      if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd || this._isOauthClientCredentials) {
        controls.client_id.patchValue(data.dati_specifici.client_id)
        // controls.client_id.setValidators(Validators.required);
      }

      if (this._isOauthAuthCode) {
        controls.url_redirezione.patchValue(data.dati_specifici.url_redirezione)
        controls.url_redirezione.setValidators(Validators.required);
        controls.url_esposizione.patchValue(data.dati_specifici.url_esposizione)
        controls.url_esposizione.setValidators(Validators.required);
        controls.help_desk.patchValue(data.dati_specifici.help_desk)
        controls.help_desk.setValidators(Validators.required);
        controls.nome_applicazione_portale.patchValue(data.dati_specifici.nome_applicazione_portale)
        controls.nome_applicazione_portale.setValidators(Validators.required);

        controls.client_id.patchValue(data.dati_specifici.client_id)
        // controls.client_id.setValidators(Validators.required);
      }
  
      controls.id_organizzazione.setValidators(Validators.required);
      if (this._isNew) {
        controls.id_soggetto.setValidators(Validators.required);

        controls.auth_type.enable();
        controls.auth_type.setValidators(Validators.required);
        controls.auth_type.updateValueAndValidity();

        controls.stato.setValidators(Validators.required);
        controls.stato.updateValueAndValidity();
      } else {
        controls.auth_type.disable();
        controls.auth_type.updateValueAndValidity();
        controls.stato.disable();
        controls.stato.updateValueAndValidity();
      }

      this._descrittoreCtrl.updateValueAndValidity();
      this._descrittoreCtrl_generato.updateValueAndValidity();
      this._descrittoreCtrl_generato_CSR.updateValueAndValidity();
      this._descrittoreCtrl_module.updateValueAndValidity();

      this._descrittoreCtrl_firma.updateValueAndValidity();
      this._descrittoreCtrl_generato_firma.updateValueAndValidity();
      this._descrittoreCtrl_generato_CSR_firma.updateValueAndValidity();
      this._descrittoreCtrl_module_firma.updateValueAndValidity();

      if (this._isClientUsedInSomeAdesioni) {
        controls.id_organizzazione.disable();
        controls.id_organizzazione.updateValueAndValidity();

        controls.ambiente.clearValidators();
        controls.ambiente.disable();
        controls.ambiente.updateValueAndValidity();
      }
      
      controls.id_soggetto.disable();
      this._checkSoggetto(controls.id_organizzazione.value);

      if (data.stato === 'configurato') {
        controls.nome.disable();
      }

      this._onChangeStato();

      this._formGroup.updateValueAndValidity();

      this._showMandatoryFields(controls);

      this.initTipiCertificato();
    }
  }

  _showMandatoryFields(data: any) {
    if (this.debugMandatoryFields) {
      console.group('Mandatory fields')
      let _nessuno: boolean = true;
      Object.keys(data).forEach((key, index) => {
        if (data[key].hasValidator(Validators.required)) {
          console.log(index + ') ', key)
          _nessuno = false
        }
        
      });
      (_nessuno == true) ? console.log('NESSUN CAMPO OBBLIGATORIO') : null;
      console.groupEnd()
    }
  }

  __onSave(body: any) {
    this._error = false;
    this._spin = true;

    let _payload:any = this._prepareDataToSend(body);

    const _DVLP_invia: boolean = true;

    if (_DVLP_invia) {
      this.apiService.saveElement(this.model, _payload).subscribe({
        next: (response: any) => {
          const _rateLimiting = response.dati_specifici?.rate_limiting || null;
          const _finalita = response.dati_specifici?.finalita || null;
          this.client = { ...response, rate_limiting: _rateLimiting, finalita: _finalita };
          this._client = new Client({ ...response, rate_limiting: _rateLimiting, finalita: _finalita });

          this.id = this.client.id_client;
          this._initBreadcrumb();
          this._isEdit = false;
          this._isNew = false;
          this._checkTipoCertificato(this.client.dati_specifici.auth_type, this.client.dati_specifici?.certificato_autenticazione?.tipo_certificato); 
          this.router.navigate([this.model, this.id], { replaceUrl: true });
          this._spin = false;
        },
        error: (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
          this._spin = false;
        }
      });
    }
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    this._isAnyCertificateUpdated = false;

    let _payload:any = this._prepareDataToSend(body);

    const _DVLP_invia: boolean = true;

    if (_DVLP_invia) {
      this.apiService.putElement(this.model, id, _payload).subscribe({
        next: (response: any) => {
          this._isEdit = !this._closeEdit;
          const _rateLimiting = response.dati_specifici?.rate_limiting || null;
          const _finalita = response.dati_specifici?.finalita || null;
          this.client = { ...response, rate_limiting: _rateLimiting, finalita: _finalita };
          this._client = new Client({ ...response, rate_limiting: _rateLimiting, finalita: _finalita });

          this._isAnyCertificateUpdated ? this._loadAll() : null;
          // this.id = this.client.id;
          this.save.emit({ id: this.id, payment: response, update: true });
        },
        error: (error: any) => {
          this._error = true;
          this._errorMsg = Tools.GetErrorMsg(error);
        }
      });
    }
  }

  _prepareDataToSend(body: any) : any {
    const _body: any = {...body};

    let temp_cert: any;
    let temp_cert_modulo: any;
    let temp_cert_generato: any = null;
    let temp_datiSpecItem: DatiSpecItem;
    let temp_commonName: CommonName;
    let temp_doubleCert: DoubleCert;

    const _payload:any = {};
    // const auth_type: any = this._auth_type || null;
    let auth_type: any = null;

    if (!this._isNew) {
      _payload.id_soggetto = _body.id_soggetto;
      auth_type = this._auth_type
    } else {
      auth_type = this._formGroup.controls.auth_type.value;
      _payload.id_soggetto = this._formGroup.getRawValue().id_soggetto;
      _payload.id_organizzazione = _body.id_organizzazione
    }

    let _bodyDatispecifici: Datispecifici = {
      auth_type: auth_type
    };

    if (this._show_erogazione_rate_limiting && _body.rate_limiting.quota) {
      _bodyDatispecifici.rate_limiting = _body.rate_limiting;
    }
    if (this._show_erogazione_finalita && _body.finalita) {
      _bodyDatispecifici.finalita = _body.finalita;
    }

    _payload.nome = _body.nome;
    _payload.stato = _body.stato;
    _payload.ambiente = this._formGroup.getRawValue().ambiente;;
    _payload.dati_specifici = _bodyDatispecifici;
    _payload.indirizzo_ip = _body?.indirizzo_ip || null;
    _payload.descrizione = _body?.descrizione || null;
  
    this._removeNullProperties(_body);

    if (_body.tipo_certificato == 'fornito') {
      
      temp_cert = {
        'tipo_documento': this._checkTipoDocumento(this._certificato_fornito),
        'content_type': _body.cert_fornito_content_type,
        'content': _body.cert_fornito_content,
        'filename': _body.cert_fornito_filename,
        'uuid': this._certificato_fornito?.uuid || null
      }
      
      this._chekIfCertificateHasUpdated(temp_cert);
      
      temp_datiSpecItem = {
        'tipo_certificato': _body.tipo_certificato,
        'certificato': temp_cert
      }

      this._removeNullProperties(temp_cert);

      _bodyDatispecifici.certificato_autenticazione = temp_datiSpecItem;
    }

    if (_body.tipo_certificato == 'richiesto_cn') {
      if (!this._isCertificatoEmpty(this._certificato_generato)) {
        temp_cert = {
          'tipo_documento': this._checkTipoDocumento(this._certificato_generato),
          'content_type': _body.cert_generato_content_type,
          'content': _body.cert_generato_content,
          'filename': _body.cert_generato_filename,
          'uuid': this._certificato_generato?.uuid || null
        }
        this._chekIfCertificateHasUpdated(temp_cert);
        temp_commonName = {
          'tipo_certificato': _body.tipo_certificato,
          'cn': _body.cn,
          'certificato': temp_cert
        }
        this._removeNullProperties(temp_cert);

      } else {

        temp_commonName = {
          'tipo_certificato': _body.tipo_certificato,
          'cn': _body.cn,
        }
      }

      _bodyDatispecifici.certificato_autenticazione = temp_commonName;
    }

    if (_body.tipo_certificato == 'richiesto_csr') {
      temp_cert = {
        'tipo_documento': this._checkTipoDocumento(this._richiesta),
        'content_type': _body.csr_richiesta_content_type,
        'content': _body.csr_richiesta_content,
        'filename': _body.csr_richiesta_filename,
        'uuid': this._richiesta?.uuid || null
      }
      this._chekIfCertificateHasUpdated(temp_cert);

      temp_cert_modulo = {
        'tipo_documento': this._checkTipoDocumento(this._modulo_richiesta),
        'content_type': _body.csr_modulo_ric_content_type,
        'content': _body.csr_modulo_ric_content,
        'filename': _body.csr_modulo_ric_filename,
        'uuid': this._modulo_richiesta?.uuid || null
      }
      this._chekIfCertificateHasUpdated(temp_cert_modulo);

      if (!this._isCertificatoEmpty(this._certificato_generato_csr)) {
        temp_cert_generato = {
          'tipo_documento': this._checkTipoDocumento(this._certificato_generato_csr),
          'content_type': _body.cert_generato_csr_content_type,
          'content': _body.cert_generato_csr_content,
          'filename': _body.cert_generato_csr_filename,
          'uuid': this._certificato_generato_csr?.uuid || null
        }
        this._chekIfCertificateHasUpdated(temp_cert_generato);
      }

      temp_doubleCert = {
        'tipo_certificato': _body.tipo_certificato,
        'richiesta': temp_cert,
        'modulo_richiesta': temp_cert_modulo
        // 'certificato': temp_cert_generato
      }

      if (temp_cert_generato) {
        temp_doubleCert.certificato = temp_cert_generato
        this._removeNullProperties(temp_cert_generato);
      }

      this._removeNullProperties(temp_cert);
      this._removeNullProperties(temp_cert_modulo);

      _bodyDatispecifici.certificato_autenticazione = temp_doubleCert;
    }

    if (_body.tipo_certificato_firma == 'fornito') {
      temp_cert = {
        'tipo_documento': this._checkTipoDocumento(this._certificato_fornito_firma),
        'content_type': _body.cert_fornito_content_type_firma,
        'content': _body.cert_fornito_content_firma,
        'filename': _body.cert_fornito_filename_firma,
        'uuid': this._certificato_fornito_firma?.uuid || null
      }

      this._chekIfCertificateHasUpdated(temp_cert);

      temp_datiSpecItem = {
        'tipo_certificato': _body.tipo_certificato_firma,
        'certificato': temp_cert
      }

      this._removeNullProperties(temp_cert);

      _bodyDatispecifici.certificato_firma = temp_datiSpecItem;
    }

    if (_body.tipo_certificato_firma == 'richiesto_cn') {

      if (!this._isCertificatoEmpty(this._certificato_generato_firma)) {
        temp_cert = {
          'tipo_documento': this._checkTipoDocumento(this._certificato_generato_firma),
          'content_type': _body.cert_generato_content_type_firma,
          'content': _body.cert_generato_content_firma,
          'filename': _body.cert_generato_filename_firma,
          'uuid': this._certificato_generato_firma?.uuid || null
        }
        this._chekIfCertificateHasUpdated(temp_cert);
        temp_commonName = {
          'tipo_certificato': _body.tipo_certificato_firma,
          'cn': _body.cn_firma,
          'certificato': temp_cert
        }
        this._removeNullProperties(temp_cert);
      } else {

        temp_commonName = {
          'tipo_certificato': _body.tipo_certificato_firma,
          'cn': _body.cn_firma
        }
      }

      _bodyDatispecifici.certificato_firma = temp_commonName;
    }

    if (_body.tipo_certificato_firma == 'richiesto_csr') {
      temp_cert = {
        'tipo_documento': this._checkTipoDocumento(this._certificato_csr_firma),
        'content_type': _body.csr_richiesta_content_type_firma,
        'content': _body.csr_richiesta_content_firma,
        'filename': _body.csr_richiesta_filename_firma,
        'uuid': this._certificato_csr_firma?.uuid || null
      }      
      this._chekIfCertificateHasUpdated(temp_cert);
      temp_cert_modulo = {
        'tipo_documento': this._checkTipoDocumento(this._modulo_richiesta_csr_firma),
        'content_type': _body.csr_modulo_ric_content_type_firma,
        'content': _body.csr_modulo_ric_content_firma,
        'filename': _body.csr_modulo_ric_filename_firma,
        'uuid': this._modulo_richiesta_csr_firma?.uuid || null
      }
      this._chekIfCertificateHasUpdated(temp_cert_modulo);

      if (!this._isCertificatoEmpty(this._certificato_generato_csr_firma)) {
        temp_cert_generato = {
          'tipo_documento': this._checkTipoDocumento(this._certificato_generato_csr_firma),
          'content_type': _body.cert_generato_csr_content_type_firma,
          'content': _body.cert_generato_csr_content_firma,
          'filename': _body.cert_generato_csr_filename_firma,
          'uuid': this._certificato_generato_csr_firma?.uuid || null
        }
        this._chekIfCertificateHasUpdated(temp_cert_generato);
      }

      temp_doubleCert = {
        'tipo_certificato': _body.tipo_certificato_firma,
        'richiesta': temp_cert,
        'modulo_richiesta': temp_cert_modulo
        // 'certificato': temp_cert_generato
      }

      if (temp_cert_generato) { 
        temp_doubleCert.certificato = temp_cert_generato
        this._removeNullProperties(temp_cert_generato);
      }

      this._removeNullProperties(temp_cert);
      this._removeNullProperties(temp_cert_modulo);
      _bodyDatispecifici.certificato_firma = temp_doubleCert;
    }

    if (this._isHttpBasic && _body.username) {
      _bodyDatispecifici.username = _body.username;
    }

    if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd) {
      _bodyDatispecifici.client_id = _body.client_id;
    }

    if (this._isOauthClientCredentials) {
      _bodyDatispecifici.client_id = _body.client_id;
    }

    if (this._isOauthAuthCode) {
      _bodyDatispecifici.url_redirezione = _body.url_redirezione;
      _bodyDatispecifici.url_esposizione = _body.url_esposizione;
      _bodyDatispecifici.help_desk = _body.help_desk;
      _bodyDatispecifici.nome_applicazione_portale = _body.nome_applicazione_portale;
      _bodyDatispecifici.client_id = _body.client_id;
    }

    this._removeNullProperties(_payload);

    return _payload;
  }

  _isCertificatoEmpty(cert: any) : boolean {
    if (cert == null) { return true; }
    return Object.keys(cert).length === 0;
  }

  _chekIfCertificateHasUpdated(temp: any) {
    if (temp.content) {
      temp.uuid = null;
      temp.tipo_documento = 'nuovo';
      this._isAnyCertificateUpdated = true;
    }
  }

  _removeNullProperties(obj: any) {
    Object.keys(obj).forEach((k: string) => {
        obj[k] == null ? delete obj[k] : null;
      })
  }

  _checkTipoDocumento(document: any): string{
    let _isNuovo: boolean;
    let _tipoDoc: string = '';
    const _docNew: string = 'nuovo';
    const _docUuid: string = 'uuid';
    (document?.uuid) ? _isNuovo = false : _isNuovo = true;
    (_isNuovo) ? _tipoDoc = _docNew : _tipoDoc = _docUuid;
    return _tipoDoc;
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(form.id_client, form);
      }
    }
  }

  _deleteClient() {
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
          this.apiService.deleteElement(this.model, this.client.id_client).subscribe({
            next: (response) => {
              this.router.navigate([this.model]);
            },
            error: (error) => {
              this._error = true;
              this._errorMsg = Tools.GetErrorMsg(error);
            }
          });
        }
      }
    );
  }

  _loadClient() {
    if (this.id) {
      this.client = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          const _rateLimiting = response.dati_specifici?.rate_limiting || null;
          const _finalita = response.dati_specifici?.finalita || null;
          this.client = { ...response, rate_limiting: _rateLimiting, finalita: _finalita };
          this._client = new Client({ ...response, rate_limiting: _rateLimiting, finalita: _finalita });

          this._initForm({ ...this._client });

          this._auth_type = response.dati_specifici.auth_type;

          this._onChangeAuthType(this.client.dati_specifici?.auth_type);

          const _cert_auth: any = {...response.dati_specifici.certificato_autenticazione};
          const _cert_firma: any = {...response.dati_specifici.certificato_firma};

          this._checkTipoCertificato(response.dati_specifici.auth_type, response.dati_specifici?.certificato_autenticazione?.tipo_certificato);
          
          (this._isFornito) ? this._certificato_fornito = {...response.dati_specifici.certificato_autenticazione.certificato} : this._certificato_fornito = null;
          
          if (this._isRichiesto_cn) {
            _cert_auth.certificato ? this._isCertificato_generato = true : this._isCertificato_generato = false;  
            this._isCertificato_generato ? this._certificato_generato = {..._cert_auth.certificato} : this._certificato_generato = null;
          }

          if (this._isRichiesto_csr) {
            _cert_auth.certificato ? this._isCertificato_generato_csr = true : this._isCertificato_generato_csr = false;  
            this._certificato_csr = {..._cert_auth.richiesta};
            this._modulo_richiesta_csr = {..._cert_auth.modulo_richiesta};
            this._certificato_generato_csr = {..._cert_auth.certificato};
          }
          
          (this._isFornito_firma) ? this._certificato_fornito_firma = {...response.dati_specifici.certificato_firma.certificato} : this._certificato_fornito_firma = null;

          if (this._isRichiesto_cn_firma) {
            _cert_firma.certificato ? this._isCertificato_generato_firma = true : this._isCertificato_generato_firma = false;
            this._isCertificato_generato_firma ? this._certificato_generato_firma = {..._cert_firma.certificato} : this._certificato_generato_firma = null;
          }

          if (this._isRichiesto_csr_firma) {
            _cert_firma.certificato ? this._isCertificato_generato_csr_firma = true : this._isCertificato_generato_csr_firma = false;
            this._certificato_csr_firma = {..._cert_firma.richiesta};
            this._modulo_richiesta_csr_firma = {..._cert_firma.modulo_richiesta};
            this._certificato_generato_csr_firma = {..._cert_firma.certificato};
          }

          (_cert_auth.richiesta?.uuid) ? this._richiesta = {..._cert_auth.richiesta} : this._richiesta = null;
          (_cert_auth.modulo_richiesta?.uuid) ? this._modulo_richiesta = {..._cert_auth.modulo_richiesta} : this._modulo_richiesta = null;

          const _options: any = { params: { id_organizzazione: this.client.soggetto.organizzazione.id_organizzazione } };
          this.apiService.getList('soggetti', _options).subscribe({
              next: (res: any ) => {
                this._spin = true;
                this._hideSoggettoDropdown = (res.content.length <= 1);
                this._elencoSoggetti = [...res.content];
                this._spin = false;
              },
              error: (error: any) => {
                Tools.OnError(error);
                this._spin = false;
              }
            });

          this._spin = false;
          this._initBreadcrumb();
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.client ? `${this.client.nome}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Client', url: '/client', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editClient() {
    this._initSoggettiSelect([this._client.soggetto]);
    this._initOrganizzazioniSelect([this._client.soggetto?.organizzazione]);

    const _options: any = { params: { id_client: this.client.id_client } };
    this.apiService.getList('adesioni', _options).subscribe({
      next: (results) => {
        this._isClientUsedInSomeAdesioni = (results.content.length > 0)
        this._initForm({ ...this._client });
        this._isEdit = true;
        this._error = false;
      },
      error: (err) => {console.log(err)}
    });
  }

  _onClose() {
    this.close.emit({ id: this.id, user: this._client });
  }

  _onSave() {
    this.save.emit({ id: this.id, user: this._client });
  }

  _onCancelEdit() {
    this._isEdit = false;
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, user: null });
      }
    } else {
      this._client = new Client({ ...this.client });
      this._checkTipoCertificato(this.client.dati_specifici.auth_type, this.client.dati_specifici?.certificato_autenticazione?.tipo_certificato);
      this._initForm({ ...this._client });
    }
    this._error = false;
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

  _resetDescrittori() {
    this._descrittoreCtrl.setValue('');
    this._descrittoreCtrl_generato.setValue('');
    this._descrittoreCtrl_generato_CSR.setValue('');
    this._descrittoreCtrl_module.setValue('');
  }

  _resetDescrittoriFirma() {
    this._descrittoreCtrl_firma.setValue('');
    this._descrittoreCtrl_generato_firma.setValue('');
    this._descrittoreCtrl_generato_CSR_firma.setValue('');
    this._descrittoreCtrl_module_firma.setValue('');
  }

  _resetCertificatoGenerato(controls: any) {
    controls.cert_generato_filename.setValue(null);
    controls.cert_generato_filename.clearValidators();
    controls.cert_generato_filename.updateValueAndValidity();
    controls.cert_generato_content.setValue(null);
    controls.cert_generato_content.clearValidators();
    controls.cert_generato_content.updateValueAndValidity();
  }

  _resetUploadCertificateComponents(controls: any) {
    controls.cert_fornito_filename.setValue(null);
    controls.cert_fornito_filename.clearValidators();
    controls.cert_fornito_filename.updateValueAndValidity();
    controls.cert_fornito_content.setValue(null);
    controls.cert_fornito_content.clearValidators();
    controls.cert_fornito_content.updateValueAndValidity();

    this._resetCertificatoGenerato(controls);

    controls.cn.setValue(null);
    controls.cn.clearValidators();
    controls.cn.updateValueAndValidity();

    controls.csr_richiesta_content.setValue(null);
    controls.csr_richiesta_content.clearValidators();
    controls.csr_richiesta_content.updateValueAndValidity();
    controls.csr_modulo_ric_content.setValue(null);
    controls.csr_modulo_ric_content.clearValidators();
    controls.csr_modulo_ric_content.updateValueAndValidity();

    this._resetDescrittori();

    this._formGroup.updateValueAndValidity()
  }

  _resetCertificatoGeneratoFirma(controls: any) {
    controls.cert_generato_filename_firma.setValue(null);
    controls.cert_generato_filename_firma.clearValidators();
    controls.cert_generato_filename_firma.updateValueAndValidity();
    controls.cert_generato_content_firma.setValue(null);
    controls.cert_generato_content_firma.clearValidators();
    controls.cert_generato_content_firma.updateValueAndValidity();
  }

  _resetUploadCertificateComponentsFirma(controls: any) {
    controls.cert_fornito_filename_firma.setValue(null);
    controls.cert_fornito_filename_firma.clearValidators();
    controls.cert_fornito_filename_firma.updateValueAndValidity();
    controls.cert_fornito_content_firma.setValue(null);
    controls.cert_fornito_content_firma.clearValidators();
    controls.cert_fornito_content_firma.updateValueAndValidity();

    this._resetCertificatoGeneratoFirma(controls);

    controls.cn_firma.setValue(null);
    controls.cn_firma.clearValidators();
    controls.cn_firma.updateValueAndValidity();

    controls.csr_richiesta_content_firma.setValue(null);
    controls.csr_richiesta_content_firma.clearValidators();
    controls.csr_richiesta_content_firma.updateValueAndValidity();
    controls.csr_modulo_ric_content_firma.setValue(null);
    controls.csr_modulo_ric_content_firma.clearValidators();
    controls.csr_modulo_ric_content_firma.updateValueAndValidity();

    this._resetDescrittoriFirma();

    this._formGroup.updateValueAndValidity()
  }

  _onChangeTipoCertificato(val: any) {
    const controls = this._formGroup.controls;

    this._resetUploadCertificateComponents(controls);

    switch (val) {
      case 'fornito':
        controls.cert_fornito_content.setValidators(Validators.required);
        controls.cert_fornito_content.updateValueAndValidity();
        this._isFornito = true; 
        this._isRichiesto_cn = false; 
        this._isRichiesto_csr = false;
        break;  
      case 'richiesto_cn':
        controls.cn.setValidators(Validators.required);
        controls.cn.updateValueAndValidity();
        if (!this._isStato_nuovo) {
          controls.cert_generato_content.setValidators(Validators.required);
          controls.cert_generato_content.updateValueAndValidity();
        }
        this._isFornito = false; 
        this._isRichiesto_cn = true; 
        this._isRichiesto_csr = false;
        break;
      case 'richiesto_csr':
        controls.csr_richiesta_content.setValidators(Validators.required);
        controls.csr_modulo_ric_content.setValidators(Validators.required);
        controls.csr_richiesta_content.updateValueAndValidity();
        controls.csr_modulo_ric_content.updateValueAndValidity();
        this._isFornito = false; 
        this._isRichiesto_cn = false; 
        this._isRichiesto_csr = true;
        break;  
      default:
        this._isFornito = false; 
        this._isRichiesto_cn = false; 
        this._isRichiesto_csr = false;
        break;
    }

    this._formGroup.updateValueAndValidity();

    this._showMandatoryFields(controls);
  }

  _onChangeTipoCertificatoFirma(val: any) {
    const controls = this._formGroup.controls;

    this._resetUploadCertificateComponentsFirma(controls);

    switch (val) {
      case 'fornito':
        controls.cert_fornito_content_firma.setValidators(Validators.required);
        controls.cert_fornito_content_firma.updateValueAndValidity();
        this._isFornito_firma = true; 
        this._isRichiesto_cn_firma = false; 
        this._isRichiesto_csr_firma = false;
        break;  
      case 'richiesto_cn':
        controls.cn_firma.setValidators(Validators.required);
        controls.cn_firma.updateValueAndValidity();
        if (!this._isStato_nuovo) {
          controls.cert_generato_content_firma.setValidators(Validators.required);
          controls.cert_generato_content_firma.updateValueAndValidity();
        }
        this._isFornito_firma = false; 
        this._isRichiesto_cn_firma = true; 
        this._isRichiesto_csr_firma = false;
        break;
      case 'richiesto_csr':
        controls.csr_richiesta_content_firma.setValidators(Validators.required);
        controls.csr_modulo_ric_content_firma.setValidators(Validators.required);
        controls.csr_richiesta_content_firma.updateValueAndValidity();
        controls.csr_modulo_ric_content_firma.updateValueAndValidity();
        this._isFornito_firma = false; 
        this._isRichiesto_cn_firma = false; 
        this._isRichiesto_csr_firma = true;
        break;  
      default:
        this._isFornito_firma = false; 
        this._isRichiesto_cn_firma = false; 
        this._isRichiesto_csr_firma = false;
        break;
    }
    
    this._formGroup.updateValueAndValidity();

    this._showMandatoryFields(controls);
  }

  _onChangeStato(event: any = null) {
    const controls: any = this._formGroup.controls;
    const _isNuovo = controls.stato.value == 'nuovo';
    this._isStato_nuovo = _isNuovo;
    if (_isNuovo) {
      if (this._isNew) { this._onChangeAuthType(null); }
      controls.username.clearValidators();
    } else {
      if (this._isHttpBasic && !this._isStato_nuovo) {
        controls.username.setValidators(Validators.required)
      }
    }
    if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd || this._isOauthClientCredentials || this._isOauthAuthCode) {
      controls.client_id.setValidators(Validators.required);
    } else {
      controls.client_id.clearValidators();
    }
    controls.username.updateValueAndValidity();
    controls.client_id.updateValueAndValidity();
  }

  _changeAmbiente(event: any) { }

  __descrittoreChange(value: any, tipo: string ) {
    const controls = this._formGroup.controls;

    switch (tipo) {
      case 'cert_generato':
        !(value) ? this._certificato_generato = null : this._certificato_generato = value;
        controls.cert_generato_filename.patchValue(value?.file);
        controls.cert_generato_content_type.patchValue(value?.type);
        controls.cert_generato_content.patchValue(value?.data);
        break;
      case 'cert_fornito':
        controls.cert_fornito_filename.patchValue(value?.file);
        controls.cert_fornito_content_type.patchValue(value?.type);
        controls.cert_fornito_content.patchValue(value?.data);
        break;
      case 'csr_modulo_richiesta':
        controls.csr_modulo_ric_filename.patchValue(value?.file);
        controls.csr_modulo_ric_content_type.patchValue(value?.type);
        controls.csr_modulo_ric_content.patchValue(value?.data);
        break;
      case 'csr_richiesta':
        controls.csr_richiesta_filename.patchValue(value?.file);
        controls.csr_richiesta_content_type.patchValue(value?.type);
        controls.csr_richiesta_content.patchValue(value?.data);
        break;
      case 'cert_generato_csr':
        !(value) ? this._certificato_generato_csr = null : this._certificato_generato_csr = value;
        controls.cert_generato_csr_filename.patchValue(value?.file);
        controls.cert_generato_csr_content_type.patchValue(value?.type);
        controls.cert_generato_csr_content.patchValue(value?.data);
        break;
    }
    
    this._formGroup.updateValueAndValidity();
    this._error = false;
    // this._errorMsg = '';
  }

  __descrittoreChangeFirma(value: any, tipo: string ) {
    const controls = this._formGroup.controls;

    switch (tipo) {
      case 'cert_generato':
        !(value) ? this._certificato_generato_firma = null : this._certificato_generato_firma = value;        
        controls.cert_generato_filename_firma.patchValue(value.file);
        controls.cert_generato_content_type_firma.patchValue(value.type);
        controls.cert_generato_content_firma.patchValue(value.data);
        break;
      case 'cert_fornito':
        controls.cert_fornito_filename_firma.patchValue(value.file);
        controls.cert_fornito_content_type_firma.patchValue(value.type);
        controls.cert_fornito_content_firma.patchValue(value.data);
        break;
      case 'csr_modulo_richiesta':
        controls.csr_modulo_ric_filename_firma.patchValue(value.file);
        controls.csr_modulo_ric_content_type_firma.patchValue(value.type);
        controls.csr_modulo_ric_content_firma.patchValue(value.data);
        break;
      case 'csr_richiesta':
        controls.csr_richiesta_filename_firma.patchValue(value.file);
        controls.csr_richiesta_content_type_firma.patchValue(value.type);
        controls.csr_richiesta_content_firma.patchValue(value.data);
        break;
      case 'cert_generato_csr_firma':
        !(value) ? this._certificato_generato_csr_firma = null : this._certificato_generato_csr_firma = value;
        controls.cert_generato_csr_filename_firma.patchValue(value?.file);
        controls.cert_generato_csr_content_type_firma.patchValue(value?.type);
        controls.cert_generato_csr_content_firma.patchValue(value?.data);
        break;
    }
    
    this._formGroup.updateValueAndValidity();
    this._error = false;
    // this._errorMsg = '';
  }

  _downloadAllegato(data: any) {
    // this.__resetError();
    this._downloading = true;

    const _partial = `${data.uuid}/download`;
    this.apiService.download(this.model, this.id, _partial).subscribe({
      next: (response: any) => {
        // const _ext = data.filename.split('/')[1];
        // let name: string = `${data.filename}.${_ext}`;
        let name: string = `${data.filename}`;
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

  _onStatusChange(event: any) {
    this._spin = true;

    const _aux: any = {'stato': event};

    this.apiService.putElementRelated(this.model, this.client.id_client, 'stato', _aux).subscribe({
      next: (response: any) => {
        this.client = new Client({ ...response });
        this._client = new Client({ ...response });
        this.id = this.client.id;
        this._isEdit = false;
        this._isNew = false;

        this._loadAll();
        this._spin = false;
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._errors = error.error.errori || [];
        this._fromStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + this.client.stato);
        this._toStatus = this.translate.instant('APP.WORKFLOW.STATUS.' + event);
        const _msg: string = this.translate.instant('APP.WORKFLOW.MESSAGE.ChangeStatusError', {status: this._toStatus});
        Tools.showMessage(_msg, 'danger', true);
        this._spin = false;
      }
    });
  }

  closeModal(){
    this._modalCambiaStatoRef.hide();
  }

  _resetValidators() {
    const controls = this._formGroup.controls;

    controls.tipo_certificato.clearValidators();
    controls.tipo_certificato.updateValueAndValidity();
    controls.tipo_certificato_firma.clearValidators();
    controls.tipo_certificato_firma.updateValueAndValidity();

    controls.url_redirezione.clearValidators();
    controls.url_redirezione.updateValueAndValidity();
    controls.url_esposizione.clearValidators();
    controls.url_esposizione.updateValueAndValidity();
    controls.help_desk.clearValidators();
    controls.help_desk.updateValueAndValidity();
    controls.nome_applicazione_portale.clearValidators();
    controls.nome_applicazione_portale.updateValueAndValidity();
    controls.client_id.clearValidators();
    controls.client_id.updateValueAndValidity();
    controls.username.clearValidators();
    controls.username.updateValueAndValidity();
  }

  initTipiCertificato() {
    this._tipoCertificatoEnum = [];
  
    const auth_type = this._formGroup.controls.auth_type.value;
    const authTypes: any = this.authenticationService._getConfigModule('servizio')?.api?.auth_type || [];

    const certificato: Certificato | null = this.utils.getCertificatoByAuthType(authTypes, auth_type);
    if (certificato) {
      this._isRichiesto_csr = certificato.csr_modulo || false;
      this._tipoCertificatoEnum = this.utils.getTipiCertificatoAttivi(certificato);
    }
  }

  _onChangeAuthType(auth_type: any = null) {
    this.initTipiCertificato();

    if (auth_type == null && this._isNew) {
      auth_type = this._formGroup.controls.auth_type.value;
      this._onChangeAuthType('valore_a_caso_per_resettare_le_variabili')
    }

    const controls: any = this._formGroup.controls;

    const authTypes: any = this.authenticationService._getConfigModule('servizio').api.auth_type;
    const configAuthType = authTypes.find((x: any) => x.type == auth_type);
    if (configAuthType) {
      this._show_erogazione_ip_fruizione = configAuthType.indirizzi_ip || false;
      this._show_erogazione_rate_limiting = configAuthType.rate_limiting || false;
      this._show_erogazione_finalita = configAuthType.finalita || false;
    }

    switch (auth_type) {
      case 'no_dati':
        this._isNoDati = true; 
        break;
      case 'indirizzo_ip':
        this._isIndirizzoIP = true; 
        break;
      case 'http_basic':
        this._isHttpBasic = true; 
        break;
      case 'oauth_authorization_code':
        this._isOauthAuthCode = true;
        controls.url_redirezione.setValidators(Validators.required);
        controls.url_redirezione.updateValueAndValidity();
        controls.url_esposizione.setValidators(Validators.required);
        controls.url_esposizione.updateValueAndValidity();
        controls.help_desk.setValidators(Validators.required);
        controls.help_desk.updateValueAndValidity();
        controls.nome_applicazione_portale.setValidators(Validators.required);
        controls.nome_applicazione_portale.updateValueAndValidity();
        // controls.client_id.setValidators(Validators.required);
        // controls.client_id.updateValueAndValidity();
        break;
      case 'oauth_client_credentials':
        this._isOauthClientCredentials = true;
        break;
      case 'https':
        this._isHttps = true;
        break;
      case 'https_sign':
        this._isHttpsSign = true;
        break;
      case 'pdnd':
        this._isPdnd = true;
        break;
      case 'https_pdnd':
        this._isHttpsPdnd = true;
        break;
      case 'https_pdnd_sign':
        this._isHttpsPdndSign = true;
        break;
      case 'sign':
        this._isSign = true;
        break;
      case 'sign_pdnd':
        this._isSignPdnd = true;
        break;
      default:
          this._isNoDati = false;
          this._isIndirizzoIP = false;
          this._isHttpBasic = false;
          this._isOauthAuthCode = false;
          this._isOauthClientCredentials = false;
          this._isHttps = false;
          this._isHttpsSign = false;
          this._isPdnd = false;
          this._isHttpsPdnd = false;
          this._isHttpsPdndSign = false;
          this._isSign = false;
          this._isSignPdnd = false;
    }

    if (auth_type != 'valore_a_caso_per_resettare_le_variabili' && this._isEdit) {
      
      const controls: any = this._formGroup.controls;

      this._resetUploadCertificateComponents(controls);
      this._resetUploadCertificateComponentsFirma(controls);
      controls.tipo_certificato.setValue(null);
      controls.tipo_certificato.updateValueAndValidity();
      controls.tipo_certificato_firma.setValue(null);
      controls.tipo_certificato_firma.updateValueAndValidity();

      if (this._isHttpBasic && !this._isStato_nuovo) {
        controls.username.setValidators(Validators.required);
        controls.username.updateValueAndValidity();
      }

      if (this._isHttps || this._isHttpsSign || this._isHttpsPdnd || this._isHttpsPdndSign) {
        controls.tipo_certificato.setValidators(Validators.required);
        controls.tipo_certificato.updateValueAndValidity();
      } else {
        controls.tipo_certificato.clearValidators();
        controls.tipo_certificato.updateValueAndValidity();
      }

      if (this._isHttpsSign || this._isHttpsPdndSign) {
        controls.tipo_certificato_firma.setValidators(Validators.required);
        controls.tipo_certificato_firma.updateValueAndValidity();
      } else {
        controls.tipo_certificato_firma.clearValidators();
        controls.tipo_certificato_firma.updateValueAndValidity();
      }

      if (this._isPdnd || this._isHttpsPdnd || this._isHttpsPdndSign || this._isSignPdnd || this._isOauthClientCredentials || this._isOauthAuthCode) {
        controls.client_id.setValidators(Validators.required);
      } else {
        controls.client_id.clearValidators();
      }

      if (this._isSign) {
        controls.tipo_certificato.clearValidators();
        controls.tipo_certificato.updateValueAndValidity();
        controls.tipo_certificato_firma.setValidators(Validators.required);
        controls.tipo_certificato_firma.updateValueAndValidity();
      }

      if (this._isSignPdnd) {
        controls.tipo_certificato.clearValidators();
        controls.tipo_certificato.updateValueAndValidity();
        controls.tipo_certificato_firma.setValidators(Validators.required);
        controls.tipo_certificato_firma.updateValueAndValidity();
      }

      this._showMandatoryFields(controls);
    }
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
            catchError(() => of([])), // empty list on error
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
            catchError(() => of([])), // empty list on error
            tap(() => this.organizzazioniLoading = false)
          )
        })
      )
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
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
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
            // item.disabled = _.findIndex(this._toExcluded, (excluded) => excluded.name === item.name) !== -1;
            return item;
          });
          return _items;
        }
      })
      );
  }

  trackByFn(item: any) {
    return item.id;
  }

  _checkSoggetto(event: any) {  
    if (event) {
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
            controls.id_soggetto.disable();
            controls.id_soggetto.clearValidators();
            controls.id_soggetto.updateValueAndValidity();
          } else {
            this._elencoSoggetti = [...result];
            controls.id_soggetto.enable();
            controls.id_soggetto.setValidators(Validators.required);
            controls.id_soggetto.updateValueAndValidity();
            this._hideSoggettoDropdown = false;
          }

          this._formGroup.updateValueAndValidity();
        },
        error: (err) => console.log(err)
      });
    } else {
      const controls = this._formGroup.controls;
      controls.id_soggetto.patchValue(null);
      controls.id_soggetto.clearValidators();
      controls.id_soggetto.updateValueAndValidity();
      this._initSoggettiSelect([]);
      this._formGroup.updateValueAndValidity();

      this._elencoSoggetti = [];
      this._hideSoggettoDropdown = true;
    }
  }

  _onChangeSoggetto(event: any) {
    console.log(this._formGroup.controls.id_soggetto.value);
  }

  public _updateMapper: string = '';

  _hasVerifica = (): boolean => {
    const monitoraggio: any = this.authenticationService._getConfigModule('monitoraggio');

    // const _isSoggettoMonitoraggio = (monitoraggio.soggetto_modi?.nome == this.client.nome) || (monitoraggio.soggetto_pdnd?.nome === this.client.nome);
    const _showMonitoraggio: boolean = monitoraggio.abilitato;
    const _showVerifiche: boolean = monitoraggio.verifiche_abilitate;

    const _authType: string = this.client?.dati_specifici.auth_type || '';

    return (
      // _isSoggettoMonitoraggio &&
      _showMonitoraggio &&
      _showVerifiche &&
      this.client?.utilizzato_in_adesioni_configurate &&
      (_authType.includes('https') || _authType.includes('sign') || _authType.includes('pdnd'))
    );
  }
}
