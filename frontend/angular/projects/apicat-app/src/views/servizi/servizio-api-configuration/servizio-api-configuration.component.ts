import { AfterContentChecked, Component, HostListener, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, FormControl, FormGroup, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { OpenAPIService } from '@app/services/openAPI.service';

import { ComponentBreadcrumbsData } from '@app/views/servizi/route-resolver/component-breadcrumbs.resolver';

import { Grant, RightsEnum } from '@app/model/grant';

import * as _ from 'lodash';
import { ApiConfiguration, ApiConfigurationRead, ApiCustomProperty, ApiDefinitionUpdateWithFile, ApiDefinitionUpdateWithReference, ApiReadDetails, ApiUpdateRequest, IHistory, Profile } from '../servizio-api-details/servizio-api-interfaces';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';
declare const saveAs: any;

interface ApiFormValues {
  nome_gateway: string;
  versione_gateway: number | null;
  url: string;
  protocollo: string;
  protocollo_dettaglio: string;
}

interface ApiForm {
  nome_gateway: FormControl<string>;
  versione_gateway: FormControl<number | null>;
  url: FormControl<string>;
  protocollo: FormControl<string>;
  proprieta_custom: UntypedFormGroup;
  descrittore: UntypedFormControl;
}

export const EROGATO_SOGGETTO_DOMINIO: string = 'erogato_soggetto_dominio';
export const EROGATO_SOGGETTO_ADERENTE: string = 'erogato_soggetto_aderente';

@Component({
  selector: 'app-servizio-api-configuration',
  templateUrl: 'servizio-api-configuration.component.html',
  styleUrls: ['servizio-api-configuration.component.scss']
})
export class ServizioApiConfigurationComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'ServizioApiConfigurationComponent';
  readonly model: string = 'api';

  EROGATO_SOGGETTO_DOMINIO: string = EROGATO_SOGGETTO_DOMINIO;
  EROGATO_SOGGETTO_ADERENTE: string = EROGATO_SOGGETTO_ADERENTE;

  id: number = 0;
  sid: string | null = null;

  environmentId: 'collaudo' | 'produzione' = 'collaudo'; // collaudo / produzione

  Tools = Tools;

  config: any;

  service: any = null;
  servizioApi: ApiReadDetails | null = null;
  proprieta_custom: any[] = [];

  _grant: Grant | null = null;
  readonly RightsEnum = RightsEnum;

  _spin: boolean = true;
  desktop: boolean = false;

  showHistory: boolean = false;

  _useRoute: boolean = false;

  _isNew: boolean = false;
  _singleColumn: boolean = false;
  _info_gateway_visualizzate: boolean = false;
  _specificaObbligatorio: boolean = false;

  _downloading = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Services', url: '', type: 'link', iconBs: 'grid-3x3-gap' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.SERVICES.TITLE.API', url: '', type: 'link' },
    { label: '...', url: '', type: 'link' },
    { label: 'APP.TITLE.PDNDConfiguration', url: '', type: 'link' }
  ];

  _descrittoreCtrl: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  _formGroup: FormGroup<ApiForm> = new FormGroup<ApiForm>({
    nome_gateway: new FormControl('', { nonNullable: true }),
    versione_gateway: new FormControl(null, [
      Validators.pattern("^[1-9][0-9]*$")
    ]),
    url: new FormControl('', { nonNullable: true }),
    protocollo: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    proprieta_custom: new UntypedFormGroup({}),
    descrittore: this._descrittoreCtrl
  });

  viewValues: ApiFormValues = {
    nome_gateway: '',
    versione_gateway: null,
    url: '',
    protocollo: '',
    protocollo_dettaglio: '',
  };

  private testingValues: ApiFormValues = {
    nome_gateway: '',
    versione_gateway: null,
    url: '',
    protocollo: '',
    protocollo_dettaglio: '',
  };

  _tipoInterfaccia: any[] = [
    { value: 'soap', label: 'APP.INTERFACE.soap' },
    { value: 'rest', label: 'APP.INTERFACE.rest' }
  ];
  _hasSpecifica = false;

  _configuration: ApiConfigurationRead | null = null;

  _pdnd: any = null;
  _apiProprietaCustom: any[] = [];
  _apiProprietaCustomGrouped: any = null;

  _updateMapper: string = '';
  _markAsteriskUpdated: boolean = true;

  _isEdit: boolean = false;

  _error: boolean = false;
  _errorMsg: string = '';

  _message = 'APP.MESSAGE.ChooseEnvironment';
  _messageHelp = 'APP.MESSAGE.ChooseEnvironmentHelp';

  _componentBreadcrumbs: ComponentBreadcrumbsData | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public utils: UtilService,
    public authenticationService: AuthenticationService
  ) {
    this.route.data.subscribe((data) => {
      if (!data.componentBreadcrumbs) return;
      this._componentBreadcrumbs = data.componentBreadcrumbs;
      this._initBreadcrumb();
    });

    this.config = this.configService.getConfiguration();
    const _state = this.router.getCurrentNavigation()?.extras.state;
    this.service = _state?.service || null;
    this._grant = _state?.grant;
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      let _id = params['id'];
      const _cid = params['cid'];
      if (_cid) { _id = _cid; }
      if (_id) {
        this.sid = _id;
        this.id = params['aid'];
        this.environmentId = params['id_ambiente'] || '';

        if (!this.service) {
          this._loadServizio();
        } else {
          this._initBreadcrumb();
        }
      }
    });
  }

  copyTestingValue(field: string, overwrite: boolean = true) {
    const control = this._formGroup.get(field);
    if (!control || (!overwrite && control.value)) {
      return;
    }

    control.setValue(this.getTestingValue(field));
    if (field === 'protocollo') {
      this.copySepcificationValue();
    }
  }

  getTestingValue(field: string) {
    const values: any = this.testingValues
    return values[field];
  }

  getCustomPropertyTestingValue(nome_gruppo: string, nome: string) {
    const _srv: any = Tools.Configurazione.servizio;
    const proprieta_custom = this.servizioApi?.proprieta_custom || [];

    const group = _srv.api.proprieta_custom.find((item: any) => item.nome_gruppo === nome_gruppo);
    if (!group) {
      return;
    }

    const collaudoGroup = _srv.api.proprieta_custom.find((item: any) => item.id_correlazione === group.id_correlazione && item.classe_dato === 'collaudo');
    if (!collaudoGroup) {
      return;
    }

    const proprietaCustomCollaudo = proprieta_custom.find((item: any) => item.gruppo === collaudoGroup.nome_gruppo);

    if (!proprietaCustomCollaudo) {
      return;
    }

    const proprieta = proprietaCustomCollaudo.proprieta.find((item: any) => item.nome === nome);

    if (!proprieta) {
      return;
    }

    return proprieta.valore;
  }

  copyCustomPropertyTestingValue(nome_gruppo: string, nome: string, overwrite: boolean = true) {
    const control = this._formGroup.get('proprieta_custom')?.get(nome_gruppo)?.get(nome);
    if (!control || (!overwrite && control.value)) {
      return;
    }
    control.setValue(this.getCustomPropertyTestingValue(nome_gruppo, nome));
  }

  copyAllTestingValues() {
    this.copyTestingValue('nome_gateway', false);
    this.copyTestingValue('versione_gateway', false);
    this.copyTestingValue('url', false);
    this.copyTestingValue('protocollo', false);

    this.copySepcificationValue(false);

    const proprieta_custom = this._apiProprietaCustom || [];

    proprieta_custom.forEach((group: any) => {
      this.copyCustomPropertyTestingValue(group.nome_gruppo, group.nome, false);
    });
  }

  private copySepcificationValue(overwrite: boolean = true) {
    if (!overwrite && this._descrittoreCtrl.value && this._descrittoreCtrl.value.file) {
      return;
    }
    const configuration = this.servizioApi?.configurazione_collaudo;
    this._descrittoreCtrl.setValue({
      file: configuration?.specifica?.filename || '',
      type: configuration?.specifica?.content_type || '',
      uuid: configuration?.specifica?.uuid || ''
    });
    this._hasSpecifica = !!configuration?.specifica;
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls as any;
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _canEditFieldMapper = (field: string): boolean => {
    return this.authenticationService.canEditField('servizio', 'api', this.service?.stato || '', field, this._grant?.ruoli);
  }

  _initBreadcrumb() {
    const _nome: string = this.service ? this.service.nome : null;
    const _versione: string = this.service ? this.service.versione : null;
    const _toolTipServizio = this.service ? this.translate.instant('APP.WORKFLOW.STATUS.' + this.service.stato) : '';
    const _api = this.servizioApi;
    const _titleAPI = _api ? `${_api.nome} v. ${_api.versione}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');

    let title = (_nome && _versione) ? `${_nome} v. ${_versione}` : this.id ? `${this.id}` : '...';
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
      { label: this.environmentId == 'collaudo' ? 'APP.TITLE.TestingConfiguration' : 'APP.TITLE.ProductionConfiguration', url: ``, type: 'link' }
    ];

    if (this._componentBreadcrumbs) {
      this.breadcrumbs.unshift(...this._componentBreadcrumbs.breadcrumbs);
    }
  }

  _loadServizio() {
    if (this.sid) {
      this.service = null;
      this._spin = true;
      this.apiService.getDetails('servizi', this.sid, 'grant').subscribe({
        next: (grant: any) => {
          this._grant = grant;

          const _srv: any = Tools.Configurazione?.servizio;
          this._specificaObbligatorio = (_srv && _srv.api) ? _srv.api.specifica_obbligatorio : false;

          this._descrittoreCtrl.setValidators([Validators.required]);
          if (!this._specificaObbligatorio) {
            // this._descrittoreCtrl.clearValidators();
          }

          this.apiService.getDetails('servizi', this.sid).subscribe({
            next: (response: any) => {
              this.service = response;
              this._initBreadcrumb();
              this._spin = false;
              this._loadServizioApi();
            },
            error: (error: any) => {
              Tools.OnError(error);
              this._spin = false;
            }
          });
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  rawData: string = '';

  _loadServizioApi() {
    if (this.id) {
      this.servizioApi = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: ApiReadDetails) => {
          this.rawData = JSON.stringify(response);
          this.mapApiDetailsToFormValues();
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  private mapApiDetailsToFormValues() {
    this.servizioApi = JSON.parse(this.rawData);
    this._resetProprietaCustom();
    if (!this.servizioApi) {
      return;
    }
    const testingConfiguration = this.servizioApi.configurazione_collaudo;

    this.testingValues = {
      nome_gateway: testingConfiguration?.dati_erogazione?.nome_gateway || '',
      versione_gateway: testingConfiguration?.dati_erogazione?.versione_gateway || null,
      url: testingConfiguration?.dati_erogazione?.url || '',
      protocollo: testingConfiguration?.protocollo || '',
      protocollo_dettaglio: testingConfiguration?.protocollo_dettaglio || ''
    };

    const configuration = this.environmentId === 'collaudo' ? this.servizioApi.configurazione_collaudo : this.servizioApi.configurazione_produzione;
    this._configuration = configuration || null;

    this.viewValues = {
      nome_gateway: configuration?.dati_erogazione?.nome_gateway || '',
      versione_gateway: configuration?.dati_erogazione?.versione_gateway || null,
      url: configuration?.dati_erogazione?.url || '',
      protocollo: configuration?.protocollo || '',
      protocollo_dettaglio: configuration?.protocollo_dettaglio || ''
    };
    this._formGroup.setValue({
      nome_gateway: configuration?.dati_erogazione?.nome_gateway || '',
      versione_gateway: configuration?.dati_erogazione?.versione_gateway || null,
      url: configuration?.dati_erogazione?.url || '',
      protocollo: configuration?.protocollo || '',
      proprieta_custom: [],
      descrittore: null
    });


    if (this.environmentId === 'collaudo') {
      this._hasSpecifica = configuration?.specifica || !configuration?.protocollo ? true : false;
    } else {

      if (configuration?.protocollo){
        this._hasSpecifica = configuration?.specifica ? true : false;
      } else {
        const _configurationCollaudo = this.servizioApi.configurazione_collaudo;
        if (!configuration?.protocollo){
          this._hasSpecifica = _configurationCollaudo?.specifica ? true : false;
        }
      }
    }

    if (this._hasSpecifica) {
      this._descrittoreCtrl.setValue({
        file: configuration?.specifica?.filename || '',
        type: configuration?.specifica?.content_type || '',
        uuid: configuration?.specifica?.uuid || ''
      });
    } else {
      this._descrittoreCtrl.clearValidators();
    }

    this.proprieta_custom = this.servizioApi?.proprieta_custom || [];
    this._initBreadcrumb();
    this._initProprietaCustom();

    this.__checkAutenticazione(this.servizioApi.ruolo);
  }

  _downloadSpecifica(versione: number = 0) {
    // this.__resetError();
    this._downloading = true;
    let aux: any;
    if (versione && versione > 0) {
      aux = this.utils._queryToHttpParams({ versione: versione });
    }
    this.apiService.download(this.model, this.id, `specifica/${this.environmentId}/download`, aux).subscribe({
      next: (response: any) => {
        let filename: string = Tools.GetFilenameFromHeader(response);
        saveAs(response.body, filename);
        this._downloading = false;
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._downloading = false;
      }
    });
  }

  _downloadHistory(item: IHistory) {
    this._downloadSpecifica(item.versione);
  }

  toggleHistorical() {
    this.showHistory = !this.showHistory;
  }

  _onDescrittoreChange(value: any) {
    // this._newDescrittore = true;
    // this.__descrittoreChange(value);
  }

  __descrittoreChange(value: any) {
    // this.__resetGAT();

    // const controls = this._formGroup.controls;
    // controls.filename.patchValue(value ? value.file : null);
    // controls.estensione.patchValue(value ? value.type : null);
    // controls.content.patchValue(value ? value.data : null);
    // controls.uuid.patchValue(value ? value.uuid : null);
    // this._formGroup.updateValueAndValidity();
    // if (value && controls.protocollo.value && controls.ruolo.value === this.EROGATO_SOGGETTO_DOMINIO) {
    //     this.__loadRisorse();
    // }
  }

  _getEService(environment: string) {
    let _environment: string = (environment === 'collaudo') ? 'PDNDCollaudo' : 'PDNDProduzione';
    let _eservice: string = '';
    let _index: number = -1;
    if (this.servizioApi?.proprieta_custom?.length) {
      _index = this.servizioApi.proprieta_custom?.findIndex((item: any) => item.gruppo === _environment);
      if (_index !== -1) {
        const _property = this.servizioApi.proprieta_custom[_index].proprieta.find((item: any) => item.nome === 'identificativo_eservice_pdnd');
        // _eservice = _property.valore;
      }
    }
    return _eservice;
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    this.mapApiDetailsToFormValues();
  }

  _onSubmit(form: any) {
    if (this._isEdit && this._formGroup.valid) {
      // this.__onUpdate(this.servizioApi.id_api, form);
      console.log('_onSubmit', form);
      this._onSaveApi(form);
    }
  }

  _hasPDNDConfigureddMapper = (environment: string): boolean => {
    return !!this._getEService(environment);
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
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

  acfg() {
    return this._formGroup.controls['proprieta_custom'] as UntypedFormGroup;
  }

  acfgc(group_name: string) {
    return (this._formGroup.controls['proprieta_custom'] as UntypedFormGroup).get(group_name) as UntypedFormGroup;
  }

  _hasControlApiCustomPropertiesError(group_name: string, name: string) {
    return (this.acfgc(group_name).controls[name].errors && this.acfgc(group_name).controls[name].touched);
  }

  _hasControlApiCustomPropertiesValue(name: string) {
    return (this.acfg().controls[name] && this.acfg().controls[name].value);
  }

  _resetProprietaCustom() {
    (this._formGroup as UntypedFormGroup).removeControl('proprieta_custom');
    this._formGroup.addControl('proprieta_custom', this.formBuilder.group({}));
    this._apiProprietaCustom = [];
    this._apiProprietaCustomGrouped = [];
  }

  _getGroupLabelMapper = (group: any): string => {
    const _srv: any = Tools.Configurazione.servizio;
    let _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom : [];
    return _proprietaCustom.find((item: any) => item.nome_gruppo === group)?.label_gruppo;
  }

  _initProprietaCustom() {
    const profiles: string[] = this.servizioApi?.gruppi_auth_type?.map((item: any) => item.profilo) || [];

    const _srv: any = Tools.Configurazione.servizio;
    const profili: Profile[] = _srv.api?.profili.filter((p: any) => profiles.includes(p.codice_interno));

    _srv.api.proprieta_custom.forEach((item: any) => {
      if (item.profili && !item.profili.some((p: string) => profili.some((pr: Profile) => pr.codice_interno === p))) {
          return;
      }

      if (item.auth_type && !item.auth_type.some((auth_type: string) => profili.some((pr: Profile) => pr.auth_type === auth_type))) {
          return;
      }

      if (item.classe_dato !== this.environmentId) {
        return;
      }

      const _gruppo = item.nome_gruppo;
      const _ruoli_abilitati = item.ruoli_abilitati;
      item.proprieta.forEach((proprieta: any) => {
        this._apiProprietaCustom.push({
          nome_gruppo: _gruppo,
          classe_dato: item.classe_dato,
          ...proprieta,
          ruoli_abilitati: _ruoli_abilitati ? [ ..._ruoli_abilitati ] : undefined
        });
      });
    });
    this._apiProprietaCustomGrouped = _.groupBy(this._apiProprietaCustom, 'nome_gruppo');

    const mandatoryFields = this.authenticationService._getFieldsMandatory('servizio', 'api', this.service.stato);
    const genericoCustomPropertiesAreMandatory = mandatoryFields.some((item: string) => item === 'generico');
    const collaudoCustomPropertiesAreMandatory = mandatoryFields.some((item: string) => item === 'collaudo');
    const produzioneCustomPropertiesAreMandatory = mandatoryFields.some((item: string) => item === 'produzione');

    if (this._apiProprietaCustom.length) {
      this._formGroup.addControl('proprieta_custom', this.formBuilder.group({}));

      Object.keys(this._apiProprietaCustomGrouped).forEach((key: any) => {
        this._apiProprietaCustomGrouped[key].forEach((item: any) => {
          const _validators = [];

          const _ruoli = this._grant?.ruoli || [];
          const _hasRuolo = item.ruoli_abilitati ? _.intersection(_ruoli, item.ruoli_abilitati).length > 0 : true;

          console.group('proprieta_custom');
          console.log(item);
          console.log('ruoli', _ruoli);
          console.log('hasRuolo', _hasRuolo);
          console.groupEnd();

          if (_hasRuolo) {
            let required = false;
  
            if(item.classe_dato === 'generico' && genericoCustomPropertiesAreMandatory) {
                required = item.required;
            }
  
            if(item.classe_dato === 'collaudo' && collaudoCustomPropertiesAreMandatory) {
                required = item.required;
            }
  
            if(item.classe_dato === 'produzione' && produzioneCustomPropertiesAreMandatory) {
                required = item.required;
            }
  
            if (required) { _validators.push(Validators.required); }
            if (item.regular_expression) { _validators.push(Validators.pattern(item.regular_expression)); }
  
            this.proprietaCustom.addControl(item.nome_gruppo, this.formBuilder.group({}));
  
            const _gruppo = this.servizioApi?.proprieta_custom?.find((pc: any) => {
              return (pc.gruppo === item.nome_gruppo);
            });
            const _value = _gruppo?.proprieta.find((p: any) => p.nome === item.nome);
            let _val = _value ? _value.valore : null;
            if (!this.servizioApi?.proprieta_custom?.length && (item.tipo === 'select')) {
              const _defaultItem = item.valori.find((item: any) => item.default);
              _val = _defaultItem?.nome || null;
            }
  
            const group = this.proprietaCustom.get(item.nome_gruppo) as FormGroup;
            group.addControl(item.nome, new FormControl(_val, [..._validators]));
          } else {
            // remove item from list
            const index = this._apiProprietaCustomGrouped[key]?.indexOf(item) || -1;
            if (index !== -1) {
              this._apiProprietaCustomGrouped = this._apiProprietaCustomGrouped[key].splice(index, 1);
            }
          }
        });
      });
    }

    this._updateMapper = new Date().getTime().toString();
  }

  get proprietaCustom(): FormGroup {
    return this._formGroup.get('proprieta_custom') as FormGroup;
  }

  _getCustomSelectLabelMapper = (cod: string, name: string, group: string) => {
    const _srv: any = Tools.Configurazione.servizio;
    const _proprietaCustom = (_srv && _srv.api) ? _srv.api.proprieta_custom : [];
    const _group = _proprietaCustom.find((item: any) => item.nome_gruppo === group);
    const _pItem = _group.proprieta.find((item: any) => item.nome === name);
    const _label = _pItem.valori.find((item: any) => item.nome === cod)?.etichetta;

    return _label || cod;
  }

  _onSaveApi(formValues: any) {
    const request: ApiUpdateRequest = {};

    const configuration: ApiConfiguration = {
      protocollo: this._formGroup.get('protocollo')?.value || undefined,
      dati_erogazione: {
        nome_gateway: this._formGroup.get('nome_gateway')?.value || undefined,
        versione_gateway: this._formGroup.get('versione_gateway')?.value || undefined,
        url: this._formGroup.get('url')?.value || undefined
      }
    };

    if (this._descrittoreCtrl.value && this._descrittoreCtrl.value.data && this._hasSpecifica) {
      const file = this._descrittoreCtrl.value;
      const specificaFile: ApiDefinitionUpdateWithFile = {
        tipo_documento: 'nuovo',
        content_type: file.type,
        filename: file.file,
        content: file.data
      };
      configuration.specifica = specificaFile;
    } else if (this._descrittoreCtrl.value && this._descrittoreCtrl.value.uuid && this._hasSpecifica) {
      const file = this._descrittoreCtrl.value;
      const specificaFile: ApiDefinitionUpdateWithReference = {
        tipo_documento: 'uuid_copia',
        uuid: file.uuid
      };
      configuration.specifica = specificaFile;
      // it is defining a copy of the file
    } else if (this._configuration?.specifica?.uuid && this._hasSpecifica) {
      const specificaReference: ApiDefinitionUpdateWithReference = {
        tipo_documento: 'uuid',
        uuid: this._configuration.specifica.uuid
      };
      configuration.specifica = specificaReference;
    } else {
      configuration.specifica = null;
    }

    if (this.environmentId === 'collaudo') {
      request.configurazione_collaudo = configuration;
    } else {
      request.configurazione_produzione = configuration;
    }

    const proprieta_custom: any = [];

    if (this._apiProprietaCustomGrouped && Object.keys(this._apiProprietaCustomGrouped).length) {
      Object.keys(this._apiProprietaCustomGrouped).forEach((k) => {
        if (this._apiProprietaCustomGrouped[k].length) {
          const _customGrouped: ApiCustomProperty = {
            gruppo: k,
            proprieta: []
          };
          this._apiProprietaCustomGrouped[k].forEach((kk: any) => {
            if (formValues.proprieta_custom[k][kk.nome]) {
              _customGrouped.proprieta.push({
                nome: kk.nome,
                valore: formValues.proprieta_custom[k][kk.nome]
              });
            }
          });
          proprieta_custom.push(_customGrouped);
        }
      });
      request.dati_custom = { proprieta_custom };
    }

    this.apiService.putElement(this.model, this.id, request).subscribe(
      (response: any) => {
        this._isEdit = false;
        this._loadServizioApi();
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  _toggleSpecifica() {
    this._hasSpecifica = !this._hasSpecifica;
    setTimeout(() => {
      if (this._specificaObbligatorio || this._hasSpecifica) {
        this._descrittoreCtrl.setValidators([Validators.required]);
      } else {
        this._descrittoreCtrl.clearValidators();
      }
      this._descrittoreCtrl.updateValueAndValidity();
      // this.__protocolloChange();
      this.__descrittoreChange(null);
    }, 100);
  }

  __checkAutenticazione(ruolo: string) {
    const controls: any = this._formGroup.controls;
    if (ruolo === this.EROGATO_SOGGETTO_DOMINIO) {
        this.__checkAmbiente(controls);
    } else {
        this.__disableAmbiente(controls);
    }
    this._formGroup.updateValueAndValidity();
}

  __checkAmbiente(controls: any) {
      const _notModifiableFields = this.authenticationService._getClassesNotModifiable('servizio', 'api', this.service.stato);
      const _mandatoryFields = this.authenticationService._getFieldsMandatory('servizio', 'api', this.service.stato);

      // const _diff = _mandatoryFields.filter( function( el ) {
      //   return _notModifiableFields.indexOf( el ) < 0;
      // } );

      _mandatoryFields.forEach((field: string) => {

          if(this.environmentId === 'collaudo' && field === 'url_collaudo') {
            field = 'url';
          }

          if(this.environmentId === 'produzione' && field === 'url_produzione') {
            field = 'url';
          }

          if (controls[field]) {
              // controls[field].enable();
              controls[field].setValidators([Validators.required]);
          }
          });

          if (!this._isNew) {
          _notModifiableFields.forEach((field: string) => {
              if (controls[field]) {
              controls[field].disable();
              }
          });
      }
      
      this._formGroup.updateValueAndValidity();
  }

  __disableAmbiente(controls: any) {
      controls.url_produzione?.disable();
      controls.url_produzione?.clearValidators();
      controls.url_collaudo?.disable();
      controls.url_collaudo?.clearValidators();
      this._formGroup.updateValueAndValidity();
  }

  _canEditMapper = (): boolean => {
    if (this.authenticationService.isGestore(this._grant?.ruoli)) { return true; }
    const mandatoryClasses: string[] = this.authenticationService._getClassesMandatory('servizio', 'api', this.service?.stato || '');
    return !mandatoryClasses.some((item: string) => item === this.environmentId);
  }

  _isGestore() {
    return this.authenticationService.isGestore(this._grant?.ruoli);
  }
}
