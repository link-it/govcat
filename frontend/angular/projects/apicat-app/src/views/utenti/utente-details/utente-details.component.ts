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
import { AfterContentChecked, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { FieldClass } from '@linkit/components';
import { CustomValidators } from '@linkit/validators';

import { YesnoDialogBsComponent } from '@linkit/components';

import { Utente, Ruolo, Stato } from './utente';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import { RuoloUtenteEnum } from '@app/model/ruoloUtenteEnum';

import * as _ from 'lodash';

@Component({
  selector: 'app-utente-details',
  templateUrl: 'utente-details.component.html',
  styleUrls: ['utente-details.component.scss'],
  standalone: false
})
export class UtenteDetailsComponent implements OnInit, OnChanges, AfterContentChecked, OnDestroy {
  static readonly Name = 'UtenteDetailsComponent';
  readonly model: string = 'utenti';

  @Input() id: number | null = null;
  @Input() utente: any = null;
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
  _formGroup: FormGroup = new FormGroup({});
  _utente: Utente = new Utente({});

  _authorizations: any[] = [];

  utenteProviders: any = null;

  // anagrafiche: any = null;

  _spin: boolean = true;
  desktop: boolean = false;

  _useRoute: boolean = true;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
    { label: 'APP.TITLE.Users', url: '/utenti', type: 'link' },
    { label: `...`, url: '', type: 'title' }
  ];

  _error: boolean = false;
  _errorMsg: string = '';

  _modalConfirmRef!: BsModalRef;

  _classi_utente: any[] = [];
  _statoArr: any[] = [];
  _ruoloArr: any[] = [];

  classiUtente$!: Observable<any[]>;
  classiUtenteInput$ = new Subject<string>();
  classiUtenteLoading: boolean = false;
  selectedClassiUtente: any;

  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;
  selectedOrganizzazione: any;

  minLengthTerm = 1;

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
    this._statoArr = Object.values(Stato);
    this._ruoloArr = Object.values(Ruolo); // [ 'nessun_ruolo','referente_servizio', 'gestore' ];

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

        this._statoArr = Object.values(Stato).slice(1);

        this._initBreadcrumb();

        this._loadClassiUtente();
        this._initClassiUtenteSelect([]);
        this._initOrganizzazioniSelect([]);
        this._initForm({ ...this._utente });
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
    if (changes.utente) {
      const utente = changes.utente.currentValue;
      this.utente = utente.source;
      this.id = this.utente.id;
    }
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  _loadAll() {
    this._loadUtente();
    this._loadClassiUtente();
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
          case 'email_aziendale':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [
              Validators.required,
              Validators.email,
              Validators.maxLength(255)
            ]);
            break;
          case 'email':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [
              Validators.email,
              Validators.maxLength(255)
            ]);
            break;
          case 'nome':
          case 'cognome':
          case 'principal':
          case 'telefono_aziendale':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [
              Validators.required,
              CustomValidators.notOnlyWhitespace,
              Validators.maxLength(255)
            ]);
            break;
          case 'stato':
          case 'id_organizzazione':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [Validators.required]);
            break;
          case 'telefono':
          case 'metadati':
          case 'note':
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [
              Validators.maxLength(255)
            ]);
            break;
          case 'referente_tecnico':
            value = data[key] ? data[key] : false;
            _group[key] = new FormControl(value, []);
            break;
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, []);
            break;
        }
      });
      this._formGroup = new FormGroup(_group);

      if(this._isEdit) {
        this._formGroup.controls.id_organizzazione.patchValue(this._utente.organizzazione?.id_organizzazione)
        this._formGroup.controls.id_organizzazione.updateValueAndValidity();
        this._formGroup.updateValueAndValidity();
      } 

      if (this._utente.stato === Stato.NON_CONFIGURATO) {
        this._statoArr = Object.values(Stato);
      } else {
        this._statoArr = Object.values(Stato).slice(1);
      }
    }
  }

  __onSave(body: any) {
    this._error = false;
    this._spin = true;
    
    const _body = this._prapareData(body);

    this.apiService.saveElement(this.model, _body).subscribe(
      (response: any) => {
        this.utente = new Utente({ ...response });
        this._utente = new Utente({ ...response });
        this.id = this.utente.id_utente;
        this._initBreadcrumb();
        const aux: any = {
          id_classe_utente: this.utente?.classi_utente?.id_classe_utente || null,
          nome: this.utente?.classi_utente?.nome || null
        }
        this._initClassiUtenteSelect([aux]);
        const aux_org: any = {
          id_organizzazione: this.utente?.id_organizzazione || null,
          descrizione: null,
          nome: null
        }
        this._initOrganizzazioniSelect([aux_org]);
        this._spin = false;
        this._isEdit = false;
        this._isNew = false;
        this.save.emit({ id: this.id, utente: response, update: false });
        this.router.navigate([this.model, this.id], { replaceUrl: true });
      },
      (error: any) => {
        this._error = true;
        console.log('__onSave error', error);
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    );
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    this._spin = true;

    const _body = this._prapareData(body);

    this.apiService.putElement(this.model, id, _body).subscribe(
      (response: any) => {
        this._isEdit = !this._closeEdit;
        this.utente = new Utente({ ...response });
        this._utente = new Utente({ ...response });
        this.utente.ruolo = this._checkRuolo(response);
        this._utente.ruolo = this._checkRuolo(response);
        this.id = this.utente.id;
        this._spin = false;
        this.save.emit({ id: this.id, utente: response, update: true });
      },
      (error: any) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    );
    
  }

  _prapareData(body: any) {
    let _classi: any[] | null = null;
    if (body.classi_utente?.length) {
      _classi = body.classi_utente.map((item: any) => item.id_classe_utente);
    }
    const _newBody: any = {
      ...body,
      ruolo: (body.ruolo == Ruolo.NESSUN_RUOLO) ? null : body.ruolo,
      classi_utente: _classi
    };
    delete _newBody.organizzazione;

    return this.utils._removeEmpty(_newBody);
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      if (this._isNew) {
        this.__onSave(form);
      } else {
        this.__onUpdate(this.utente.id_utente, form);
      }
    }
  }

  _deleteUser() {
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
          this.apiService.deleteElement(this.model, this.utente.id_utente).subscribe(
            (response) => {
              this.router.navigate([this.model]);
              // this.save.emit({ id: this.id, utente: response, update: false });
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

  _loadUtente() {
    if (this.id) {
      this.utente = null;
      this.apiService.getDetails(this.model, this.id).subscribe({
        next: (response: any) => {
          this.utente = new Utente({ ...response });
          this._utente = new Utente({ ...response });

          this.utente.ruolo = this._checkRuolo(response);
          this._utente.ruolo = this._checkRuolo(response);
          // this._utente.ruolo = response?.ruolo || Ruolo.NESSUN_RUOLO;
          
          const aux: any = {
            id_classe_utente: this.utente.classi_utente?.id_classe_utente || null,
            nome: this.utente.classi_utente?.nome || null
          }
          this._initClassiUtenteSelect([aux]);
          const aux_org: any = {
            id_organizzazione: this.utente.organizzazione?.id_organizzazione || null,
            descrizione: this.utente.organizzazione?.descrizione || null,
            nome: this.utente.organizzazione?.nome || null
          }
          if (this.utente.organizzazione) {
            this._initOrganizzazioniSelect([aux_org])
          } else {
            this._initOrganizzazioniSelect([])
          }
          
          this._initBreadcrumb();

          this._spin = false;
          // this.__initInformazioni();
        },
        error: (error: any) => {
          Tools.OnError(error);
          this._spin = false;
        }
      });
    }
  }

  _initBreadcrumb() {
    const _title = this.utente ? `${this.utente.nome} ${this.utente.cognome}` : this.translate.instant('APP.TITLE.New');
    this.breadcrumbs = [
      { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
      { label: 'APP.TITLE.Users', url: '/utenti', type: 'link' },
      { label: `${_title}`, url: '', type: 'title' }
    ];
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editUser() {
    this._isEdit = true;
    this._initForm({ ...this._utente });
    this._utente.organizzazione ? this._initOrganizzazioniSelect([this._utente.organizzazione]) : this._initOrganizzazioniSelect([]);
    this._error = false;
    this._changeRuolo();
  }

  _onClose() {
    this.close.emit({ id: this.id, utente: this._utente });
  }

  _onSave() {
    this.save.emit({ id: this.id, utente: this._utente });
  }

  _onCancelEdit() {
    this._isEdit = false;
    this._error = false;
    this._errorMsg = '';
    if (this._isNew) {
      if (this._useRoute) {
        this.router.navigate([this.model]);
      } else {
        this.close.emit({ id: this.id, utente: null });
      }
    } else {
      this._utente = new Utente({ ...this.utente });
    }
  }

  onBreadcrumb(event: any) {
    if (this._useRoute) {
      this.router.navigate([event.url]);
    } else {
      this._onClose();
    }
  }

  _loadClassiUtente() {
    this.apiService.getList('classi-utente').subscribe({
      next: (response: any) => {
        this._classi_utente = response.content;
      },
      error: (error: any) => {
        Tools.OnError(error);
      }
    });
  }

  trackByFn(item: any) {
    return item.id;
  }

  _initClassiUtenteSelect(defaultValue: any[] = []) {
    this.classiUtente$ = concat(
      of(defaultValue),
      this.classiUtenteInput$.pipe(
        filter(res => {
          return res !== null && res.length >= this.minLengthTerm
        }),
        distinctUntilChanged(),
        debounceTime(500),
        tap(() => this.classiUtenteLoading = true),
        switchMap((term: any) => {
          return this.getClassiUtente(term).pipe(
            catchError(() => of([])), // empty list on error
            tap(() => this.classiUtenteLoading = false)
          )
        })
      )
    );
  }

  getClassiUtente(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term, referente: true } };
    return this.apiService.getList('classi-utente', _options)
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

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
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

  _compareClassiFn(item: any, selected: any) {
    return item.id_classe_utente === selected.id_classe_utente;
  }

  _changeRuolo(event: Event|null = null) {
    const role = this._formGroup.get('ruolo')?.value;
    const organizationFormControl = this._formGroup.get('id_organizzazione');
    if(!organizationFormControl){
      console.warn('organizationFormControl does not exist');
      return;
    }
    if(role === RuoloUtenteEnum.Gestore){
      organizationFormControl.clearValidators();
    }else{
      organizationFormControl.setValidators([Validators.required]);
    }
    organizationFormControl.updateValueAndValidity();
  }

  _checkRuolo(data: any) : Ruolo | null {
    return data?.ruolo || Ruolo.NESSUN_RUOLO;
  }
}
