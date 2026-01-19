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
import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { CustomValidators } from '@linkit/validators';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Dominio } from './dominio';

import { VisibilitaEnum } from '@app/model/visibilitaEnum';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { UtilService } from '@app/services/utils.service';

import { DominioCreateUpdateRequest } from './dominio-create-update';

@Component({
  selector: 'app-dominio-details',
  templateUrl: 'dominio-details.component.html',
  styleUrls: ['dominio-details.component.scss'],
  standalone: false
})
export class DominioDetailsComponent implements OnInit, OnChanges, AfterContentChecked {
  static readonly Name = 'DominioDetailsComponent';
  readonly model: string = 'domini';

  @Input() id: number | null = null;
  @Input() dominio: any = null;
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
  _dominio: Dominio = new Dominio({});

  serviceProviders: any = null;

  soggetti$!: Observable<any[]>;
  soggettiInput$ = new Subject<string>();
  soggettiLoading: boolean = false;
  selectedSoggetto: any;

  minLengthTerm = 1;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  _dominioPlaceHolder: string = './assets/images/logo-placeholder.png';
  _organizationLogoPlaceholder: string = './assets/images/organization-placeholder.png';
  _dominioLogoPlaceholder: string = './assets/images/dominio-placeholder.png';

  _organizations: any[] = [];
  _selectedDominio: any = null;

  _visibilitaEnum: any;

  anagrafiche: any;

  constructor(
    protected route: ActivatedRoute,
    protected router: Router,
    protected fb: FormBuilder,
    protected translate: TranslateService,
    protected modalService: BsModalService,
    protected configService: ConfigService,
    public tools: Tools,
    protected eventsManagerService: EventsManagerService,
    protected apiService: OpenAPIService,
    protected utils: UtilService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  ngOnInit() {
    this._visibilitaEnum = ['privato', 'pubblico', 'riservato'];

    this.anagrafiche = this.utils.getAnagrafiche(['classi-utente']);

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

        this._initBreadcrumb();
        this._initSoggettiSelect([]);
        this._initForm({ ...this._dominio });
        this._isNew = true;
        this._isEdit = true;
        this._spin = false;
      }

    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.id) {
      this.id = changes.id.currentValue;
      this._loadAll();
    }
    if (changes.dominio) {
      const dominio = changes.dominio.currentValue;
      this.dominio = dominio.source;
      this.id = this.dominio.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadDominio();
  }

  _hasControlError(name: string) {
    return (this.f[name] && this.f[name].errors && this.f[name].touched);
  }

  get f(): { [key: string]: AbstractControl } {
    return this._formGroup.controls;
  }

  _initForm(data: any = null) {
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
              CustomValidators.notOnlyWhitespace,
              Validators.maxLength(255)
            ]);
            break;
          case 'visibilita':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'classi':
            const classi = (data[key] ? data[key] : []);
            _group[key] = new UntypedFormControl(classi.map((classe: any) => classe.id_classe_utente), [Validators.required]);
            break;
          case 'soggetto_referente':
            value = data[key]?.id_soggetto ? data[key].id_soggetto : null;
            _group[key] = new UntypedFormControl(value, [Validators.required]);
            break;
          case 'descrizione':
            value = data[key] ? data[key] : null;
            _group[key] = new UntypedFormControl(value, [
              Validators.maxLength(255)
            ]);
            break;
          case 'deprecato':
            value = data[key] ? data[key] : false;
            _group[key] = new UntypedFormControl(value, []);
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

      this._formGroup.get('visibilita')?.valueChanges.subscribe((value: any) => {
        this.checkClassiState(value, true);
      });

      this._enableDisableSkipCollaudo(data.soggetto_referente);
      this.checkClassiState(data.visibilita);
    }
  }

  private checkClassiState(value: string, resetValue: boolean = false){
    const classiControl = this._formGroup.get('classi');
    if (!classiControl) return;

    if (resetValue) classiControl.setValue([]);

    if ('riservato' === value) {
      classiControl.setValidators([Validators.required]);
    } else {
      classiControl.clearValidators();
    }
    classiControl.updateValueAndValidity();
    this._formGroup.updateValueAndValidity();
  }

  _onServiceLoaded(event: any, field: string) {
    this._selectedDominio = event.target.dominios[0];
  }

  __onSave(body: any) {
    this._error = false;
    this._spin = true;
    
    const _body = {...body};
    _body.id_soggetto_referente = body.soggetto_referente;
    delete _body.soggetto_referente;
    this._removeNullProperties(_body);

    console.log('POST: ', _body)

    this.apiService.saveElement(this.model, _body).subscribe({
      next: (response: any) => {
        this.dominio = new Dominio({ ...response });
        this._dominio = new Dominio({ ...response });
        this.id = this.dominio.id_dominio;
        this._initBreadcrumb();
        this._initSoggettiSelect([this.dominio.soggetto_referente]);
        
        this._spin = false;
        this._isEdit = false;
        this._isNew = false;
        this.router.navigate([this.model, this.id], { replaceUrl: true });
      },
      error: (error: any) => {
        this._error = true;
        console.error('__onSave', error);
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    });
  }

  __onUpdate(id: number, body: any) {

    const _body: DominioCreateUpdateRequest = {
      nome: body.nome,
      visibilita: body.visibilita,
      classi: body.classi,
      id_soggetto_referente: body.soggetto_referente,
      descrizione: body.descrizione,
      tag: body.tag || null,
      deprecato: body.deprecato,
      url_invocazione: body.url_invocazione || null,
      url_prefix_collaudo: body.url_prefix_collaudo || null,
      url_prefix_produzione: body.url_prefix_produzione || null,
      skip_collaudo: body.skip_collaudo || false,
    };

    this.apiService.putElement(this.model, id, _body).subscribe({
        next: (response: any) => {
          this._isEdit = !this._closeEdit;
          this.dominio = new Dominio({ ...response });
          this._dominio = new Dominio({ ...response });
          this.id = this.dominio.id;
          this.save.emit({ id: this.id, payment: response, update: true });
        },
        error: (error: any) => {
          this._error = true;
          this._errorMsg = this.utils.GetErrorMsg(error);
        }
    });
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.dominio.id_dominio, form);
      }
    }
  }

  _deleteDominio() {
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
          this.apiService.deleteElement(this.model, this.dominio.id_dominio).subscribe(
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

  _loadDominio() {
    if (this.id) {
      this._spin = true;
      this.dominio = null;

      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.dominio = response; // new Dominio({ ...response });
          this._dominio = new Dominio({ ...response });
          this._initBreadcrumb();
          const aux: any = {
            id_soggetto: this.dominio.soggetto_referente.id_soggetto,
            nome: this.dominio.soggetto_referente.nome,
          }
          this._initSoggettiSelect([aux]);

          this._enableDisableSkipCollaudo(this.dominio.soggetto_referente);
      
          this._initForm({...this.dominio});

          this._spin = false;
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  trackByFn(item: any) {
    return item.id;
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

  getSoggetti(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, referente: true } };
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

  _enableDisableSkipCollaudo(soggetto: any) {
    if (soggetto?.skip_collaudo) {
      if (this.dominio.vincola_skip_collaudo) {
        this._formGroup.get('skip_collaudo')?.setValue(false);
        this._formGroup.get('skip_collaudo')?.disable();
      } else {
        this._formGroup.get('skip_collaudo')?.enable();
      }
    } else {
      this._formGroup.get('skip_collaudo')?.disable();
    }
  }

  onChangeSoggetto(event: any) {
    this._enableDisableSkipCollaudo(event);
  }

  _initBreadcrumb() {
    const _title = this.dominio ? this.dominio.nome : this.id ? `${this.id}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.LABEL.Domain', url: '/domini', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  _editDominio() {
    this._initForm({ ...this._dominio });
    this._isEdit = true;
    this._error = false;
  }

  _onClose() {
    this.close.emit({ id: this.id, dominio: this._dominio });
  }

  _onSave() {
    this.save.emit({ id: this.id, dominio: this._dominio });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, dominio: null });
      }
    } else {
      this._dominio = new Dominio({ ...this.dominio });
    }
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
        obj[k] == null ? delete obj[k] : null;
      })
  }

  _isVisibilita(type: string) {
    return (this.f['visibilita'] && this.f['visibilita'].value === type);
  }
}
