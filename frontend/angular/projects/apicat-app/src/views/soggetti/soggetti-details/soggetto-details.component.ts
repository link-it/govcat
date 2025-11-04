import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { UtilService } from '@app/services/utils.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Soggetto, TipoGateway } from './soggetto';
import { SoggettoCreate } from './soggettoCreate';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'app-soggetto-details',
  templateUrl: 'soggetto-details.component.html',
  styleUrls: ['soggetto-details.component.scss'],
  standalone: false
})
export class SoggettoDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'SoggettoDetailsComponent';
  readonly model: string = 'soggetti';

  @Input() id: number | null = null;
  @Input() soggetto: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _isDetails = true;

  _editable: boolean = false;
  _deleteable: boolean = false;
  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _soggetto: Soggetto = new Soggetto({});
  _soggettoCreate: SoggettoCreate = new SoggettoCreate({});

  serviceProviders: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;
  _selectedOrganizzazione: any = null;

  minLengthTerm = 1;

  _soggettoPlaceHolder: string = './assets/images/logo-placeholder.png';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _soggettoLogoPlaceholder: string = './assets/images/soggetto-placeholder.png';

  _organizations: any[] = [];
  // _soggetto: any[] = [];
  _selectedSoggetto: any = null;

  _trueFalse: any[] =[];

  _showAderente: boolean = true;
  _showReferente: boolean = true;
  _profiloGatewayAbilitato: boolean = false;
  _listaProfiliGateway: string[] = [
    'APIGateway',
    'ModIPA',
    'SPCoop',
    'FatturaPA',
    'eDelivery'
  ];

  public _soggettoConfig: any = null;

  vincolaSkipCollaudo: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    private tools: Tools,
    private utils: UtilService,
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService
  ) {
    this.appConfig = this.configService.getConfiguration();
    this._soggettoConfig = this.authenticationService._getConfigModule('soggetto');
    this._profiloGatewayAbilitato = this._soggettoConfig?.profilo_gateway_abilitato || '';
    this._listaProfiliGateway = this._soggettoConfig?.lista_profili_gateway || this._listaProfiliGateway;
  }

  ngOnInit() {
    this._trueFalse = ['true', 'false'];

    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.id = params['id'];
        
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
        this._showAderente = false;
        this._showReferente = false;
        this._initBreadcrumb();
        this._initOrganizzazioniSelect([]);
        this._initForm({ ...this._soggettoCreate });
        this._spin = false;
      }
    });
  }

  ngOnDestroy() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.soggetto) {
      const soggetto = changes.soggetto.currentValue;
      this.soggetto = soggetto.source;
      this.vincolaSkipCollaudo = this.soggetto.vincola_skip_collaudo
      this.id = this.soggetto.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadSoggetto();
    // this._loadDomini();
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
    console.log('data: ', data)
    data.descrizione ? null : data.descrizione = '';
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'nome':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
                Validators.required,
                Validators.pattern('^[0-9A-Za-z][-A-Za-z0-9]*$'),
                Validators.maxLength(255)
              ]);
            break;
          case 'aderente':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl({ value: value, disabled: (data['vincola_aderente'] && value) }, [Validators.required]);
            break;
          case 'referente':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl({ value: value, disabled: (data['vincola_referente'] && value) }, [Validators.required]);
            break;
          case 'organizzazione':
          // case 'id_organizzazione':
            value = data[key].id_organizzazione ? data[key].id_organizzazione : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'descrizione':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.maxLength(255)]);
            break;
          case 'skip_collaudo':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl(value, []);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);

      if (this.soggetto) {
        this._formGroup.controls.aderente.patchValue(this.soggetto.aderente)
        this._formGroup.controls.referente.patchValue(this.soggetto.referente)
        this._formGroup.controls.aderente.updateValueAndValidity();
        this._formGroup.controls.referente.updateValueAndValidity();
        if (this.soggetto.vincola_skip_collaudo) {
          this._formGroup.controls.skip_collaudo.disable();
        } else {
          this._formGroup.controls.skip_collaudo.enable();
        }
        this._formGroup.controls.skip_collaudo.updateValueAndValidity();
        
        const aux: any = {
          id_organizzazione: this.soggetto.organizzazione.id_organizzazione,
          nome: this.soggetto.organizzazione.nome
        }
        this._initOrganizzazioniSelect([aux]);
      }
    }
  }

  _onOrganizzazioneLoaded(event: any) {
    const controls:any = this._formGroup.controls;

    if(event) {
      this._selectedOrganizzazione = event;
      
      this._showAderente = this._selectedOrganizzazione.aderente;
      this._showReferente = this._selectedOrganizzazione.referente;

      controls.aderente.patchValue(this._selectedOrganizzazione.aderente)
      controls.referente.patchValue(this._selectedOrganizzazione.referente)

      if(this._isNew) {
        // ---- serve solo per far accendere i toggle !! ---
        this.soggetto = new Soggetto(); 
        this.soggetto.aderente = this._selectedOrganizzazione.aderente;
        this.soggetto.referente = this._selectedOrganizzazione.referente;
        // --------
      } else {
        this.soggetto.aderente = this._selectedOrganizzazione.aderente;
        this.soggetto.referente = this._selectedOrganizzazione.referente;
      }

    } else {
      this._showAderente = false;
      this._showReferente = false;

      controls.aderente.patchValue(null)
      controls.referente.patchValue(null)
    }
    
    controls.aderente.updateValueAndValidity()
    controls.referente.updateValueAndValidity()

    this._formGroup.updateValueAndValidity()
  }

  __onSave(body: any) {
    this._error = false;
    const _body = {...body};

    _body.id_organizzazione = body.organizzazione;
    delete _body.organizzazione;

    this._removeNullProperties(_body);

    if (this._profiloGatewayAbilitato) {
      _body.nome_gateway = _body.nome_gateway || null;
      _body.tipo_gateway = _body.tipo_gateway || null;
    } else {
      delete _body.nome_gateway;
      delete _body.tipo_gateway;
    }

    console.log('POST: ', _body)

    const _DVLP_invia: boolean = true;

    if (_DVLP_invia) {

      this.apiService.saveElement(this.model, _body)
        .subscribe({
          next: (response: any) => {
            console.log('***', response)
            this.id = response.id_soggetto;
            this.soggetto = new Soggetto({ ...response });
            this._soggetto = new Soggetto({ ...response });

            // this._showAderente = this.soggetto.organizzazione.aderente
            // this._showReferente = this.soggetto.organizzazione.referente

            this._isEdit = false;
            this._isNew = false;
            
            this._initBreadcrumb();
            this._onCancelEdit();
          },
          error: (error: any) => {
            this._error = true;
            this._errorMsg = this.utils.GetErrorMsg(error);
          }
        });
    }
  }

  __onUpdate(id: number, body: any) {
    const _body = { ...body };
    console.log('__onUpdate body', _body)
    // _body.id_organizzazione = this.soggetto.organizzazione?.id_organizzazione || body.organizzazione;
    _body.id_organizzazione = body.organizzazione;
    if (_body.vincola_referente) {
      _body.referente = true; 
    }
    if (_body.vincola_aderente) {
      _body.aderente = true; 
    }

    delete _body.organizzazione;

    this._removeNullProperties(_body);

    if (this._profiloGatewayAbilitato) {
      _body.nome_gateway = _body.nome_gateway || null;
      _body.tipo_gateway = _body.tipo_gateway || null;
    } else {
      delete _body.nome_gateway;
      delete _body.tipo_gateway;
    }

    console.log('PUT: ', _body)

    const _DVLP_invia: boolean = true;

    if (_DVLP_invia) {

      this.apiService.putElement(this.model, id, _body).subscribe(
        (response: any) => {
          this._isEdit = !this._closeEdit;
          this.soggetto = new Soggetto({ ...response });
          this._soggetto = new Soggetto({ ...response });
          this.id = this.soggetto.id_soggetto;
          this.save.emit({ id: this.id, payment: response, update: true });
        },
        (error: any) => {
          this._error = true;
          this._errorMsg = this.utils.GetErrorMsg(error);
        }
      );
    }
  }

  _changeAderente(event: any) {
    this._formGroup.controls.aderente.patchValue(!this._formGroup.controls.aderente.value);
    this._formGroup.controls.aderente.updateValueAndValidity();
  }

  _changeReferente(event: any) {
    this._formGroup.controls.referente.patchValue(!this._formGroup.controls.referente.value);
    this._formGroup.controls.referente.updateValueAndValidity();
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.soggetto.id_soggetto, form);
      }
    }
  }

  _deleteSoggetto() {
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
          this.apiService.deleteElement(this.model, this.soggetto.id_soggetto).subscribe(
            (response) => {
              this.router.navigate([this.model]);
            },
            (error) => {
              this._error = true;
              this._errorMsg = this.utils.GetErrorMsg(error);
            }
          );
        }
      }
    );
  }

  _downloadAction(event: any) {
    // Dummy
  }

  _loadSoggetto() {
    if (this.id) {
      this.soggetto = null;

      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.soggetto = response; // new Soggetto({ ...response });
          this._soggetto = new Soggetto({ ...response });

          this.soggetto.id_organizzazione = this.soggetto.organizzazione.id_organizzazione;
          this._soggetto.id_organizzazione = this.soggetto.organizzazione.id_organizzazione;

          this._initBreadcrumb();
          this._showAderente = this.soggetto.organizzazione.aderente
          this._showReferente = this.soggetto.organizzazione.referente
          this.vincolaSkipCollaudo = this.soggetto.vincola_skip_collaudo

          this._updateMapper = new Date().getTime().toString();
          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  public domini: any[] = [];

  _loadDomini() {
    if (this.id) {
      this.domini = [];

      let aux:any = null;
      aux = { params: this.utils._queryToHttpParams({ id_soggetto: this.id }) };

      this._spin = true;
      this.apiService.getList('domini', aux).subscribe({
        next: (response: any) => {
          this.domini = response.content;
          this._updateMapper = new Date().getTime().toString();
          this._spin = false;
        },
        error: (error: any) => {
          console.log('domini err', error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.soggetto ? this.soggetto.nome : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Subjects', url: '/soggetti', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editSoggetto() {
    this._initForm({ ...this._soggetto });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, soggetto: this._soggetto });
  }

  _onSave() {
    this.save.emit({ id: this.id, soggetto: this._soggetto });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, soggetto: null });
      }
    } else {
      // this._soggetto = new Soggetto({ ...this.soggetto });
      // this._showAderente = this.soggetto.aderente
      // this._showReferente = this.soggetto.referente
    }
  }

  _onEditComponent(event: any, component: any) {
    console.log('_onEditComponent', component);
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
            tap(() =>  this.organizzazioniLoading = false)
          )
        })
      )
    );
  }

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('organizzazioni', _options)
      .pipe(map(resp => {        if (resp.Error) {
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

  trackByFn(item: any) {
    return item.id;
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

  _removeNullProperties(obj: any) {
    Object.keys(obj).forEach((k: string) => {
        ((obj[k] === null) || (obj[k] === undefined) || (obj[k] === '')) ? delete obj[k] : null;
      })
  }

  public _updateMapper: string = '';

  _hasVerifica = (): boolean => {
    const monitoraggio: any = this.authenticationService._getConfigModule('monitoraggio');

    const _showMonitoraggio: boolean = monitoraggio?.abilitato || false;
    const _showVerifiche: boolean = monitoraggio?.verifiche_abilitate || false;

    return (
      _showMonitoraggio &&
      _showVerifiche &&
      // !!this.domini?.length
      (this.soggetto?.vincola_aderente || this.soggetto?.vincola_referente)
    );
  }
}
