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
import { AbstractControl, FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { TranslateService } from '@ngx-translate/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { MarkdownModule } from 'ngx-markdown';

import { COMPONENTS_IMPORTS, Tools, ConfigService, FieldClass, YesnoDialogBsComponent } from '@linkit/components';
import { APP_COMPONENTS_IMPORTS } from '@app/components/components-imports';
import { OpenAPIService } from '@app/services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { CustomValidators } from '@linkit/validators';

import { Utente, Ruolo, RuoloOrganizzazione, Stato } from './utente';
import { AuthenticationService } from '@app/services/authentication.service';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { HasPermissionDirective } from '@app/directives/has-permission/has-permission.directive';
import { TrimOnBlurDirective } from '@app/directives/trim-on-blur/trim-on-blur.directive';

@Component({
  selector: 'app-utente-details',
  templateUrl: 'utente-details.component.html',
  styleUrls: ['utente-details.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ...COMPONENTS_IMPORTS,
    ...APP_COMPONENTS_IMPORTS,
    HasPermissionDirective,
    TrimOnBlurDirective,
    MarkdownModule
  ]
})
export class UtenteDetailsComponent implements OnInit, OnChanges, AfterContentChecked {
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

  _fromDashboard: boolean = false;
  /** Membership evolutiva 2026-06-11: la rotta
   *  `organizzazione-manage/:id/utenti/:uid` viene risolta dal
   *  router con `data.fromOrgManage = true` e param `uid`.
   *  Adattiamo breadcrumb e back per tornare alla tab
   *  `utenti_pending` dell'org-manage. */
  _fromOrgManage: boolean = false;
  _fromOrgManageIdOrg: string = '';
  _fromOrgManageTab: string = 'utenti_pending';
  _dashboardSection: string = '';

  minLengthTerm = 1;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly modalService: BsModalService,
    private readonly configService: ConfigService,
    public tools: Tools,
    private readonly apiService: OpenAPIService,
    private readonly utils: UtilService,
    private readonly authenticationService: AuthenticationService
  ) {
    this.appConfig = this.configService.getConfiguration();
  }

  /**
   * Issue 229 evolutiva 2/3 — ruolo che l'approvatore vuole
   * assegnare all'utente sull'organizzazione di destinazione
   * (pending). Default `null` ("Nessun ruolo"): l'approvatore
   * deve scegliere esplicitamente fra
   * `amministratore_organizzazione`, `operatore_api` o lasciare
   * l'utente senza ruolo organizzazione. L'AMM_ORG e` invece
   * vincolato a `operatore_api` per policy (decisione
   * context-aware, selettore nascosto).
   *
   * Valori ammessi nel `<select>`:
   * - `''` (empty string) -> nessun ruolo, viene trasformato in
   *   `ruolo_organizzazione: null` nel payload;
   * - `'amministratore_organizzazione'` / `'operatore_api'`.
   */
  _approvingRole: RuoloOrganizzazione | '' = '';

  /** True se l'utente loggato puo` scegliere fra entrambi i ruoli
   *  organizzazione (gestore o coordinatore). Falso per AMM_ORG ->
   *  selettore bloccato su `operatore_api`. */
  get _canChooseApprovingRole(): boolean {
    return this.authenticationService.isGestore()
      || this.authenticationService.isCoordinatore();
  }

  /** True se l'utente loggato puo` modificare il dettaglio
   *  dell'utente in pagina. Gestore/Coordinatore via permesso
   *  globale `utenti.edit`; AMM_ORG quando agisce dalla pagina
   *  di approvazione in `organizzazione-manage` (flag
   *  `_fromOrgManage` → la rotta e` gia` gated dal contesto
   *  org-manage). */
  get _canEditUser(): boolean {
    if (this._fromOrgManage) { return true; }
    return this.authenticationService.hasPermission('utenti', 'edit');
  }

  /** True quando il BE ha popolato `organizzazione_partenza` o, in
   *  fallback retrocompat, esiste `organizzazione` legacy (decisione
   *  fallback "usare legacy organizzazione" per la UI "da X a Y"). */
  get _orgPartenzaForUi(): { nome?: string | null } | null {
    return this.utente?.organizzazione_partenza
      ?? this.utente?.organizzazione
      ?? null;
  }

  /**
   * Restituisce l'organizzazione "principale" dell'utente: la prima
   * della lista multi-org se popolata, altrimenti fallback sul campo
   * legacy `organizzazione`. Il form admin gestisce ancora una sola
   * associazione, quindi questa shape coerente serve a popolare il
   * dropdown e il control `id_organizzazione`.
   */
  private _getPrimaryOrg(u: any): any {
    return u?.organizzazioni?.[0]?.organizzazione ?? u?.organizzazione ?? null;
  }

  /**
   * Stringa markdown gia` tradotta da renderizzare nel banner
   * di approvazione cambio org. Estratta in un getter perche` la
   * direttiva `markdown` attribute di ngx-markdown legge il
   * contenuto del tag come testo statico al bootstrap: con `@if/
   * @else` interni non vede i grassetti `**...**` (il control
   * flow Angular si espande DOPO). Usato con
   * `<markdown [data]="_pendingMessage">`.
   */
  get _pendingMessage(): string {
    const partenzaNome = this._orgPartenzaForUi?.nome;
    const destinazioneNome = this.utente?.organizzazione_pending?.nome || '--';
    const key = partenzaNome
      ? 'APP.PROFILE.ORGANIZATION.PassaggioDaA'
      : 'APP.PROFILE.ORGANIZATION.PassaggioA';
    return this.translate.instant(key, {
      partenza: partenzaNome,
      destinazione: destinazioneNome
    });
  }

  ngOnInit() {
    this._statoArr = Object.values(Stato);
    const coordinatoreAbilitato = Tools.Configurazione?.utente?.coordinatore_abilitato !== false;
    // `referente_servizio` e' deprecato in favore di `utente_organizzazione`:
    // non lo proponiamo nelle nuove creazioni / modifiche, ma lo mostriamo
    // se gia' valorizzato sull'utente caricato (retrocompat).
    const baseRoles = Object.values(Ruolo).filter(r => r !== Ruolo.REFERENTE_SERVIZIO);
    this._ruoloArr = coordinatoreAbilitato
      ? baseRoles
      : baseRoles.filter(r => r !== Ruolo.COORDINATORE);

    // Origine `fromOrgManage` (membership evolutiva): segnalata via
    // `route.data` dalla rotta `organizzazione-manage/:id/utenti/:uid`.
    // Il param org-id e` `params['id']` (parent) e l'utente-id e`
    // `params['uid']` (child).
    this.route.data.subscribe(d => {
      if (d?.['fromOrgManage']) { this._fromOrgManage = true; }
    });

    this.route.params.subscribe(params => {
      if (this._fromOrgManage) {
        this._fromOrgManageIdOrg = params['id'] || '';
      }
      const utenteId = this._fromOrgManage ? params['uid'] : params['id'];
      if (utenteId && utenteId !== 'new') {
        this.id = utenteId;
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

        this._statoArr = Object.values(Stato).filter(s => s !== Stato.NON_CONFIGURATO && s !== Stato.PENDING_UPDATE);

        this._initBreadcrumb();

        this._loadClassiUtente();
        this._initClassiUtenteSelect([]);
        this._initOrganizzazioniSelect([]);
        // Default per i nuovi utenti: nessun ruolo globale e nessuna
        // organizzazione obbligatoria. La required su `id_organizzazione`
        // viene applicata dinamicamente da `_changeRuolo()` solo se il
        // ruolo selezionato e' `utente_organizzazione`.
        this._utente.ruolo = Ruolo.NESSUN_RUOLO;
        this._initForm({ ...this._utente });
        this._changeRuolo();
        this._spin = false;
      }
    });

    this.route.queryParams.subscribe((val) => {
      if (val.from === 'dashboard') {
        this._fromDashboard = true;
        this._dashboardSection = val.section || '';
        this._initBreadcrumb();
      }
      if (this._fromOrgManage && val.tab) {
        this._fromOrgManageTab = val.tab;
        this._initBreadcrumb();
      }
    });
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
    return !!(this.f[name].errors && this.f[name].touched);
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
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, [Validators.required]);
            break;
          case 'id_organizzazione':
            // La required e' dinamica: viene applicata da `_changeRuolo()`
            // solo quando il ruolo selezionato e' `utente_organizzazione`.
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, []);
            break;
          case 'telefono':
          case 'metadati':
          case 'note':
          case 'organizzazione_esterna':
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
        const primaryOrg = this._getPrimaryOrg(this._utente);
        this._formGroup.controls.id_organizzazione.patchValue(primaryOrg?.id_organizzazione)
        this._formGroup.controls.id_organizzazione.updateValueAndValidity();
        this._formGroup.updateValueAndValidity();
      }

      if (this._utente.stato === Stato.PENDING_UPDATE) {
        this._statoArr = [Stato.PENDING_UPDATE];
        this._formGroup.get('stato')?.disable();
        this._formGroup.get('id_organizzazione')?.disable();
      } else if (this._utente.stato === Stato.NON_CONFIGURATO) {
        this._statoArr = Object.values(Stato).filter(s => s !== Stato.PENDING_UPDATE);
      } else {
        this._statoArr = Object.values(Stato).filter(s => s !== Stato.NON_CONFIGURATO && s !== Stato.PENDING_UPDATE);
      }
    }
  }

  __onSave(body: any) {
    this._error = false;
    this._spin = true;
    
    const _body = this._prapareData(body);

    this.apiService.saveElement(this.model, _body).subscribe({
      next: (response: any) => {
        this.utente = new Utente({ ...response });
        this._utente = new Utente({ ...response });
        this.id = this.utente.id_utente;
        this._initBreadcrumb();
        const aux: any = {
          id_classe_utente: this.utente?.classi_utente?.id_classe_utente || null,
          nome: this.utente?.classi_utente?.nome || null
        }
        this._initClassiUtenteSelect([aux]);
        const primaryOrg = this._getPrimaryOrg(this.utente);
        this._initOrganizzazioniSelect([{
          id_organizzazione: primaryOrg?.id_organizzazione || null,
          descrizione: primaryOrg?.descrizione || null,
          nome: primaryOrg?.nome || null
        }]);
        this._spin = false;
        this._isEdit = false;
        this._isNew = false;
        this.save.emit({ id: this.id, utente: response, update: false });
        this.router.navigate([this.model, this.id], { replaceUrl: true });
      },
      error: (error: any) => {
        this._error = true;
        console.log('__onSave error', error);
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    });
  }

  __onUpdate(id: number, body: any) {
    this._error = false;
    this._spin = true;

    const _body = this._prapareData(body);

    this.apiService.putElement(this.model, id, _body).subscribe({
      next: (response: any) => {
        this._isEdit = !this._closeEdit;
        this.utente = new Utente({ ...response });
        this._utente = new Utente({ ...response });
        this.utente.ruolo = this._checkRuolo(response);
        this._utente.ruolo = this._checkRuolo(response);
        this.id = this.utente.id;
        this._spin = false;
        this.save.emit({ id: this.id, utente: response, update: true });
      },
      error: (error: any) => {
        this._error = true;
        this._errorMsg = this.utils.GetErrorMsg(error);
        this._spin = false;
      }
    });
  }

  _prapareData(body: any) {
    let _classi: any[] | null = null;
    if (body.classi_utente?.length) {
      _classi = body.classi_utente.map((item: any) => item.id_classe_utente || item);
    }
    const _newBody: any = {
      ...body,
      ruolo: (body.ruolo == Ruolo.NESSUN_RUOLO) ? null : body.ruolo,
    };

    // Multi-org: trasforma `id_organizzazione` + `ruolo_organizzazione`
    // del form in `organizzazioni: [{...}]`. Il BE ignora il campo
    // legacy `id_organizzazione` se `organizzazioni` e' presente.
    const idOrg = body.id_organizzazione;
    const ruoloOrg = body.ruolo_organizzazione || null;
    if (idOrg) {
      _newBody.organizzazioni = [{
        id_organizzazione: idOrg,
        ruolo_organizzazione: ruoloOrg
      }];
    } else {
      _newBody.organizzazioni = [];
    }

    delete _newBody.organizzazione;
    delete _newBody.organizzazione_pending;
    delete _newBody.id_organizzazione;
    delete _newBody.ruolo_organizzazione;
    delete _newBody.classi_utente;

    const result = this.utils._removeEmpty(_newBody);
    result.classi_utente = _classi;
    // `_removeEmpty` elimina array vuoti: re-iniettiamo `organizzazioni`
    // solo se non vuoto, altrimenti il BE riceve null/assente (utente
    // non associato).
    if (_newBody.organizzazioni?.length) {
      result.organizzazioni = _newBody.organizzazioni;
    }
    return result;
  }

  _onSubmit(form: any, close: boolean = true) {
    if (this._isEdit && this._formGroup.valid) {
      this._closeEdit = close;
      const rawForm = this._formGroup.getRawValue();
      if (this._isNew) {
        this.__onSave(rawForm);
      } else {
        this.__onUpdate(this.utente.id_utente, rawForm);
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
          this.apiService.deleteElement(this.model, this.utente.id_utente).subscribe({
            next: (response: any) => {
              this.router.navigate([this.model]);
            },
            error: (error: any) => {
              this._error = true;
              this._errorMsg = this.utils.GetErrorMsg(error);
            }
          });
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

          // Deriva il ruolo per-organizzazione dalla prima associazione
          // (la lista `organizzazioni` riflette il modello multi-org).
          const firstOrg = response?.organizzazioni?.[0];
          this.utente.ruolo_organizzazione = firstOrg?.ruolo_organizzazione || null;
          this._utente.ruolo_organizzazione = firstOrg?.ruolo_organizzazione || null;
          
          const aux: any = {
            id_classe_utente: this.utente.classi_utente?.id_classe_utente || null,
            nome: this.utente.classi_utente?.nome || null
          }
          this._initClassiUtenteSelect([aux]);
          const primaryOrg = this._getPrimaryOrg(this.utente);
          if (primaryOrg) {
            this._initOrganizzazioniSelect([{
              id_organizzazione: primaryOrg.id_organizzazione || null,
              descrizione: primaryOrg.descrizione || null,
              nome: primaryOrg.nome || null
            }]);
          } else {
            this._initOrganizzazioniSelect([]);
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
    if (this._fromOrgManage && this._fromOrgManageIdOrg) {
      // Membership evolutiva: Gestione organizzazione →
      //   (lista utenti in attesa) → <utente>
      this.breadcrumbs = [
        {
          label: 'APP.ORGANIZATION_MANAGE.Title',
          url: `/organizzazione-manage/${this._fromOrgManageIdOrg}`,
          type: 'link',
          params: { tab: this._fromOrgManageTab }
        },
        { label: `${_title}`, url: '', type: 'title' }
      ];
    } else if (this._fromDashboard) {
      const _dashboardParams = this._dashboardSection ? { section: this._dashboardSection } : null;
      this.breadcrumbs = [
        { label: 'APP.TITLE.Dashboard', url: '/dashboard', type: 'link', iconBs: 'speedometer2', params: _dashboardParams },
        { label: `${_title}`, url: '', type: 'title' }
      ];
    } else {
      this.breadcrumbs = [
        { label: 'APP.TITLE.Configurations', url: '', type: 'title', iconBs: 'gear' },
        { label: 'APP.TITLE.Users', url: '/utenti', type: 'link' },
        { label: `${_title}`, url: '', type: 'title' }
      ];
    }
  }

  _clickTab(tab: string) {
    this._currentTab = tab;
  }

  _editUser() {
    this._isEdit = true;
    this._initForm({ ...this._utente });
    const primaryOrg = this._getPrimaryOrg(this._utente);
    primaryOrg ? this._initOrganizzazioniSelect([primaryOrg]) : this._initOrganizzazioniSelect([]);
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
      if (event.params) {
        this.router.navigate([event.url], { queryParams: event.params });
      } else {
        this.router.navigate([event.url], { queryParamsHandling: 'preserve' });
      }
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

  _compareClassiFn(item: any, selected: any) {
    return item.id_classe_utente === selected.id_classe_utente;
  }

  /**
   * Issue 229 evolutiva 3 — rifiuto della richiesta di cambio
   * organizzazione di un altro utente. Solo
   * gestore/coordinatore/AMM_ORG sull'org pending (stesso
   * filtro di authorization del PUT di approvazione).
   *
   * `DELETE /utenti/{id}/organizzazione-pending`. Stato finale
   * BE dipende dal contesto:
   * - utente con associazioni esistenti -> `abilitato`;
   * - utente nuovo da registrazione (nessuna assoc) ->
   *   `non_configurato`.
   */
  rejectOrganizationChange() {
    if (!this.utente?.organizzazione_pending?.id_organizzazione) {
      // safety net: il bottone dovrebbe gia` essere nascosto.
      return;
    }
    const initialState = {
      title: this.translate.instant('APP.PROFILE.ORGANIZATION.RejectTitle'),
      messages: [this.translate.instant('APP.PROFILE.ORGANIZATION.RejectWarning')],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.PROFILE.ORGANIZATION.RejectButton'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this._error = false;
          this._errorMsg = '';
          this._spin = true;
          this.apiService.deleteElementRelated('utenti', this.utente.id_utente, 'organizzazione-pending').subscribe({
            next: (response: any) => {
              this.utente = new Utente({ ...response });
              this._utente = new Utente({ ...response });
              this.utente.ruolo = this._checkRuolo(response);
              this._utente.ruolo = this._checkRuolo(response);
              this._initForm({ ...this._utente });
              this._changeRuolo();
              const primaryOrg = this._getPrimaryOrg(this.utente);
              this._initOrganizzazioniSelect([{
                id_organizzazione: primaryOrg?.id_organizzazione || null,
                nome: primaryOrg?.nome || null
              }]);
              this._spin = false;
              this._isEdit = false;
              this.save.emit({ id: this.id, utente: response, update: true });
            },
            error: (error: any) => {
              this._error = true;
              this._errorMsg = this.utils.GetErrorMsg(error);
              this._spin = false;
            }
          });
        }
      }
    );
  }

  approveOrganizationChange() {
    const hasCurrentOrg = !!this._getPrimaryOrg(this.utente);
    const warningKey = hasCurrentOrg
      ? 'APP.PROFILE.ORGANIZATION.ApproveWarning'
      : 'APP.PROFILE.ORGANIZATION.ApproveWarningFirstOrg';
    const initialState = {
      title: this.translate.instant('APP.PROFILE.ORGANIZATION.ApproveTitle'),
      messages: [
        this.translate.instant(warningKey)
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.PROFILE.ORGANIZATION.ApproveButton'),
      confirmColor: hasCurrentOrg ? 'danger' : 'confirm'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this._error = false;
          this._errorMsg = '';

          // Issue 229 evolutiva 2 — il BE non archivia + ricrea piu`,
          // mantiene lo stesso id_utente. Il payload deve contenere:
          //  - lo `stato` aggiornato a `abilitato` (la transizione che
          //    approva la richiesta in `pending_update`);
          //  - una sola entry in `organizzazioni` con
          //    `id_organizzazione == organizzazione_pending` e il ruolo
          //    scelto dall'approvatore;
          //  - i campi anagrafici dal form (principal, nome, cognome,
          //    telefono*, email*, ruolo globale).
          // Le altre associazioni esistenti restano server-side (NON
          // le re-inviamo).
          const formValues = this._formGroup.getRawValue();
          // Issue 229 evolutiva 3 — gestore/coordinatore possono
          // ora scegliere "Nessun ruolo" (`_approvingRole === ''`)
          // -> mappato a `null` nel payload. AMM_ORG resta forzato
          // a `operatore_api` (selettore nascosto).
          const ruoloOrgTarget: RuoloOrganizzazione | null = this._canChooseApprovingRole
            ? (this._approvingRole || null)
            : RuoloOrganizzazione.OPERATORE_API;
          const _body: any = {
            ...formValues,
            stato: Stato.ABILITATO,
            ruolo: (formValues.ruolo == Ruolo.NESSUN_RUOLO) ? null : formValues.ruolo
          };
          // Rimuoviamo i campi legacy: il BE ora ricava org/ruolo dalla
          // entry in `organizzazioni`. Senza la delete, manderemmo dati
          // ridondanti / potenzialmente in conflitto.
          delete _body.organizzazione;
          delete _body.organizzazione_pending;
          delete _body.organizzazione_partenza;
          delete _body.id_organizzazione;
          delete _body.ruolo_organizzazione;
          delete _body.organizzazioni;

          // ATTENZIONE: `_removeEmpty` (utils.service.ts:351) filtra via
          // tutti i valori di tipo `object` (incluse le array). Vedi
          // riga 355: `typeof obj[k] !== "object"`. Costruiamo quindi
          // `organizzazioni` DOPO la chiamata, altrimenti l'array
          // verrebbe stripped dal payload (questo era il bug riscontrato:
          // il payload partiva senza la key `organizzazioni`).
          const body = this.utils._removeEmpty(_body);
          body.organizzazioni = [{
            id_organizzazione: this.utente.organizzazione_pending?.id_organizzazione,
            ruolo_organizzazione: ruoloOrgTarget
          }];

          this._spin = true;
          this.apiService.putElement(this.model, this.utente.id_utente, body).subscribe({
            next: (response: any) => {
              this.utente = new Utente({ ...response });
              this._utente = new Utente({ ...response });
              this.utente.ruolo = this._checkRuolo(response);
              this._utente.ruolo = this._checkRuolo(response);
              this._initForm({ ...this._utente });
              this._changeRuolo();
              const primaryOrg = this._getPrimaryOrg(this.utente);
              this._initOrganizzazioniSelect([{
                id_organizzazione: primaryOrg?.id_organizzazione || null,
                nome: primaryOrg?.nome || null
              }]);
              this._spin = false;
              this._isEdit = false;
              this.save.emit({ id: this.id, utente: response, update: true });
            },
            error: (error: any) => {
              this._error = true;
              this._errorMsg = this.utils.GetErrorMsg(error);
              this._spin = false;
            }
          });
        }
      }
    );
  }

  /**
   * Visibilita' del campo email personale (in coerenza col profilo).
   * Pilotata dal flag `AppConfig.Profile.showEmail` (default false).
   */
  get mostraEmail(): boolean {
    return this.appConfig?.AppConfig?.Profile?.showEmail === true;
  }

  /**
   * Visibilita' del campo telefono personale (default nascosto).
   * Pilotata dal flag `AppConfig.Profile.showPhone`.
   */
  get mostraTelefono(): boolean {
    return this.appConfig?.AppConfig?.Profile?.showPhone === true;
  }

  _changeRuolo(event: Event|null = null) {
    const role = this._formGroup.get('ruolo')?.value;
    const organizationFormControl = this._formGroup.get('id_organizzazione');
    if(!organizationFormControl){
      console.warn('organizationFormControl does not exist');
      return;
    }
    // L'organizzazione e' obbligatoria solo in creazione di un
    // nuovo utente quando il ruolo selezionato e'
    // `utente_organizzazione`. In modifica di un utente esistente
    // le associazioni multi-org sono gia` gestite (eventualmente
    // come array `organizzazioni[]`) e il control del form
    // mantiene solo l'associazione "principale" come backward
    // compatibility: non va forzato required.
    if(this._isNew && role === Ruolo.UTENTE_ORGANIZZAZIONE){
      organizationFormControl.setValidators([Validators.required]);
    } else {
      organizationFormControl.clearValidators();
    }
    organizationFormControl.updateValueAndValidity();
  }

  _checkRuolo(data: any) : Ruolo | null {
    return data?.ruolo || Ruolo.NESSUN_RUOLO;
  }
}
