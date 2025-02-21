import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { FieldClass } from 'projects/components/src/lib/classes/definitions';

import { YesnoDialogBsComponent } from 'projects/components/src/lib/dialogs/yesno-dialog-bs/yesno-dialog-bs.component';

import { Organizzazione } from './organizzazione';

@Component({
  selector: 'app-organizzazione-details',
  templateUrl: 'organizzazione-details.component.html',
  styleUrls: ['organizzazione-details.component.scss']
})
export class OrganizzazioneDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'OrganizzazioneDetailsComponent';
  readonly model: string = 'organizzazioni';

  @Input() id: number | null = null;
  @Input() organizzazione: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  _title: string = '';

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _informazioni: FieldClass[] = [];

  _isDetails = true;

  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _organizzazione: Organizzazione = new Organizzazione({});

  organizzazioneProviders: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  _imagePlaceHolder: string = './assets/images/logo-placeholder.png';

  soggetti: any[] = [];
  _hideSoggettoDropdown: boolean = true;
  _hideSoggettoInfo: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
    public tools: Tools,
    private eventsManagerService: EventsManagerService,
    private apiService: OpenAPIService,
    private utils: UtilService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
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

        this._initBreadcrumb();

        if (this._isEdit) {
          this._initForm({ ...this._organizzazione });
        } else {
          this._loadAll();
        }

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
    if (changes.organizzazione) {
      const organizzazione = changes.organizzazione.currentValue;
      this.organizzazione = organizzazione.source;
      this.id = this.organizzazione.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadOrganization();
    this._loadSoggetti();
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {

    const aux_config = Tools.Configurazione.organizzazione

    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'nome':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.required,
              Validators.maxLength(255)
            ]);
            break;
          case 'codice_ente':
            value = data[key] ? data[key] : null;
            if(aux_config.codice_ente_abilitato) {
              _group[key] = new UntypedFormControl(value, [Validators.required, Validators.maxLength(255)]);
            } else {
              _group[key] = new UntypedFormControl(value, [Validators.maxLength(255)]);
            }
            break;
          case 'codice_fiscale_soggetto':
            value = data[key] ? data[key] : null;
            if(aux_config.codice_fiscale_ente_abilitato) {
              _group[key] = new UntypedFormControl(value, [Validators.required, Validators.maxLength(255)]);
            } else {
              _group[key] = new UntypedFormControl(value, [Validators.maxLength(255)]);
            }
            break;
          case 'id_tipo_utente':
            value = data[key] ? data[key] : null;
            if(aux_config.id_tipo_utente_abilitato) {
              _group[key] = new UntypedFormControl(value, [Validators.required, Validators.maxLength(255)]);
            } else {
              _group[key] = new UntypedFormControl(value, [Validators.maxLength(255)]);
            }
            break;
          case 'aderente':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl({ value: value, disabled: data['vincola_aderente'] });
            break;
          case 'referente':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl({ value: value, disabled: data['vincola_referente'] });
            break;
          case 'esterna':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl({ value: value, disabled: this._isNew ? false : !data['cambio_esterna_consentito'] });
            break;
          case 'descrizione':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.maxLength(255)
            ]);
            break;
          case 'id_soggetto_default':
            value = this.organizzazione?.soggetto_default?.id_soggetto || null;
            _group[key] = new UntypedFormControl(value, []);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);

      if (this._isNew) {
        this._formGroup.controls.referente.setValue(false);
        this._formGroup.controls.referente.updateValueAndValidity();

        this._formGroup.controls.aderente.setValue(false);
        this._formGroup.controls.aderente.updateValueAndValidity();

        this._formGroup.updateValueAndValidity();
      }

    }
  }

  _onImageLoaded(event: any, field: string) {
    const _base64 = event ? window.btoa(event) : null; // btoa - atob
    this._formGroup.get(field)?.setValue(_base64);
  }

  _decodeImage = (data: string): string => {
    return data ? window.atob(data) : this._imagePlaceHolder;
  };

  __onSave(body: any) {
    this._error = false;
    this._spin = true;

    const _body = this._prepareBodySaveOrganizzazione(body);
    delete _body['id_organizzazione'];

    this.apiService.saveElement(this.model, _body).subscribe(
      (response: any) => {
        this.organizzazione = new Organizzazione({ ...response });
        this._organizzazione = new Organizzazione({ ...response });
        this.id = this.organizzazione.id_organizzazione;
        this._initBreadcrumb();
        this._spin = false;
        this._isEdit = false;
        this._isNew = false;
        this.save.emit({ id: this.id, payment: response, update: false });
        this.router.navigate([this.model, this.id], { replaceUrl: true });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  _prepareBodySaveOrganizzazione(body: any) {
    const _body = {
      ...body,
      descrizione: body.descrizione || null,
      codice_ente: body.codice_ente || null,
      codice_fiscale_soggetto: body.codice_fiscale_soggetto || null,
      id_tipo_utente: body.id_tipo_utente || null
    };
    return { ..._body };
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    // this._spin = true;

    const _body = this._prepareBodyUpdateOrganizzazione(body);

    this.apiService.putElement(this.model, id, _body).subscribe(
      (response: any) => {
        this._isEdit = !this._closeEdit;
        this.organizzazione = response; // new Organizzazione({ ...response });
        this._organizzazione = new Organizzazione({ ...response });
        this.id = this.organizzazione.id;
        this.save.emit({ id: this.id, payment: response, update: true });
        this._spin = false;
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  _prepareBodyUpdateOrganizzazione(body: any) {
    const _body = {
      ...body,
      descrizione: body.descrizione || null,
      codice_ente: body.codice_ente || null,
      codice_fiscale_soggetto: body.codice_fiscale_soggetto || null,
      id_tipo_utente: body.id_tipo_utente || null
    };
    return { ..._body };
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.organizzazione.id_organizzazione, form);
      }
    }
  }

  _deleteOrganization() {
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
          this.apiService.deleteElement(this.model, this.organizzazione.id_organizzazione).subscribe(
            (response) => {
              this.router.navigate([this.model]);
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

  _loadOrganization() {
    if (this.id) {
      this.organizzazione = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          // console.log('Organizzazione: ', response)
          this.organizzazione = new Organizzazione({ ...response });
          this._organizzazione = new Organizzazione({ ...response });
          this._title = this.organizzazione.creditorReferenceId;

          if (this.config.detailsTitle) {
            this._title = Tools.simpleItemFormatter(this.config.detailsTitle, this.organizzazione);
          }

          this._hideSoggettoDropdown = this.organizzazione.aderente ? false : true;

          this._initBreadcrumb()

          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _loadSoggetti() {
    if (this.id) {
      let aux: any = { params: this.utils._queryToHttpParams({ id_organizzazione: this.id }) };
      this.apiService.getList('soggetti', aux).subscribe({
        next: (response: any) => {
          this.soggetti = response.content;

          // const controls = this._formGroup.controls;
          // if (this.soggetti.length == 1) {
          //   this._hideSoggettoDropdown = true;
          //   this._hideSoggettoInfo = true;
          // } else {
          //   this._hideSoggettoDropdown = false;
          //   this._hideSoggettoInfo = false;
          // }
        },
        error: (error: any) => {
          Tools.OnError(error);
        }
      });
    }
  }

  _onChangeSoggetto(event: any) {
  }

  _initBreadcrumb() {
    const _title = this.organizzazione ? `${this.organizzazione.nome}` : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Organizations', url: '/organizzazioni', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editOrganization() {
    this._initForm({ ...this._organizzazione });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, organizzazione: this._organizzazione });
  }

  _onSave() {
    this.save.emit({ id: this.id, organizzazione: this._organizzazione });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, organizzazione: null });
      }
    } else {
      this._organizzazione = new Organizzazione({ ...this.organizzazione });
    }
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

  _toggleReferente() {
    this._formGroup.controls.referente.setValue(!this._formGroup.controls.referente.value);
    this._formGroup.controls.referente.updateValueAndValidity();
    this._formGroup.updateValueAndValidity();
  }

  _toggleAderente() {
    this._formGroup.controls.aderente.setValue(!this._formGroup.controls.aderente.value);
    this._formGroup.controls.aderente.updateValueAndValidity();
    this._hideSoggettoDropdown = this._formGroup.controls.aderente.value ? false : true;
    if (!this._formGroup.controls.aderente.value) {
      this._formGroup.controls.id_soggetto_default.setValue(null);
      this._formGroup.controls.id_soggetto_default.updateValueAndValidity();
    }
    this._formGroup.updateValueAndValidity();
  }

  _toggleEsterna() {
    this._formGroup.controls.esterna.setValue(!this._formGroup.controls.esterna.value);
    this._formGroup.controls.esterna.updateValueAndValidity();
    this._formGroup.updateValueAndValidity();
  }

}
