import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { FieldClass } from '@linkit/components';

import { YesnoDialogBsComponent } from '@linkit/components';

import { ClasseUtente } from './classe-utente';
import { UtilService } from '@app/services/utils.service';

import * as _ from 'lodash';

@Component({
  selector: 'app-classe-utente-details',
  templateUrl: 'classe-utente-details.component.html',
  styleUrls: ['classe-utente-details.component.scss'],
  standalone: false

})
export class ClasseUtenteDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'ClasseUtenteDetailsComponent';
  readonly model: string = 'classi-utente';

  @Input() id: number | null = null;
  @Input() classeUtente: any = null;
  @Input() config: any = null;

  @Output() close: EventEmitter<any> = new EventEmitter<any>();
  @Output() save: EventEmitter<any> = new EventEmitter<any>();

  appConfig: any;

  hasTab: boolean = true;
  tabs: any[] = [
    { label: 'Details', icon: 'details', link: 'details', enabled: true }
  ];
  _currentTab: string = 'details';

  _informazioni: FieldClass[] = [];

  _isDetails = true;

  _editable: boolean = false;
  _deleteable: boolean = false;
  _isEdit = false;
  _closeEdit = true;
  _isNew = false;
  _formGroup: UntypedFormGroup = new UntypedFormGroup({});
  _classeUtente: ClasseUtente = new ClasseUtente({});

  serviceProviders: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  _classeUtentePlaceHolder: string = './assets/images/logo-placeholder.png';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _classeUtenteLogoPlaceholder: string = './assets/images/classeUtente-placeholder.png';

  _organizations: any[] = [];
  // _classeUtentes: any[] = [];
  _selectedClasseUtente: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private modalService: BsModalService,
    private configService: ConfigService,
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
          this._initForm({ ...this._classeUtente });
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
    if (changes.classeUtente) {
      const classeUtente = changes.classeUtente.currentValue;
      this.classeUtente = classeUtente.source;
      this.id = this.classeUtente.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadClasseUtente();
  }

  _hasControlError(name: string) {
    return (this.f[name].errors && this.f[name].touched);
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
          case 'nome':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.required,
              Validators.maxLength(255)
            ]);
            break;
          case 'descrizione':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.maxLength(255)
            ]);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, []);
            break;
        }
      });
      this._formGroup = new UntypedFormGroup(_group);
    }
  }

  // _onServiceLoaded(event: any, field: string) {
  //   this._selectedClasseUtente = event.target.classeUtentes[0];
  // }

  __onSave(body: any) {
    this._error = false;

    this._removeNullProperties(body);

    this.apiService.saveElement(this.model, body).subscribe(
      (response: any) => {
        this.classeUtente = new ClasseUtente({ ...response });
        this._classeUtente = new ClasseUtente({ ...response });
        this.id = this.classeUtente.id_classe_utente;
        this._initBreadcrumb();
        this._isEdit = false;
        this._isNew = false;
        this.utils.refreshAnagrafiche(['classi-utente']);
        this.save.emit({ id: this.id, payment: response, update: false });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  __onUpdate(id: number, body: any) {
    this._error = false;

    this._removeNullProperties(body);

    this.apiService.putElement(this.model, id, body).subscribe(
      (response: any) => {
        this._isEdit = !this._closeEdit;
        this.classeUtente = new ClasseUtente({ ...response });
        this._classeUtente = new ClasseUtente({ ...response });
        this.id = this.classeUtente.id_classe_utente;
        this.utils.refreshAnagrafiche(['classi-utente']);
        this.save.emit({ id: this.id, payment: response, update: true });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = Tools.GetErrorMsg(error);
      }
    );
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.classeUtente.id_classe_utente, form);
      }
    }
  }

  _removeNullProperties(obj: any) {
    Object.keys(obj).forEach((k: string) => {
        _.isEmpty(obj[k]) ? delete obj[k] : null;
      })
  }

  _deleteClasseUtente() {
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
          this.apiService.deleteElement(this.model, this.classeUtente.id_classe_utente).subscribe(
            (response) => {
              this.utils.refreshAnagrafiche(['classi-utente']);
              this.save.emit({ id: this.id, classeUtente: response, update: false });
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

  _downloadAction(event: any) {
    // Dummy
  }

  _loadClasseUtente() {
    if (this.id) {
      this.classeUtente = null;

      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.classeUtente = new ClasseUtente({ ...response });
          this._classeUtente = new ClasseUtente({ ...response });

          this._initBreadcrumb();
          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.classeUtente ? this.classeUtente.nome : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.UserClasses', url: '/classi-utente', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editClasseUtente() {
    this._initForm({ ...this._classeUtente });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, classeUtente: this._classeUtente });
  }

  _onSave() {
    this.save.emit({ id: this.id, classeUtente: this._classeUtente });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, classeUtente: null });
      }
    } else {
      this._classeUtente = new ClasseUtente({ ...this.classeUtente });
    }
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }
}
