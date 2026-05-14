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
import { AfterContentChecked, Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { concat, Observable, of, Subject, throwError } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, switchMap, tap } from 'rxjs/operators';

import { Tools, ConfigService, YesnoDialogBsComponent, InputHelpComponent, COMPONENTS_IMPORTS } from '@linkit/components';
import { LnkButtonComponent } from '@app/components/lnk-ui/button/button.component';
import { LnkFormFieldComponent } from '@app/components/lnk-ui/form-field/form-field.component';
import { LnkFormErrorComponent } from '@app/components/lnk-ui/form-error/form-error.component';
import { LnkFormSubmitComponent } from '@app/components/lnk-ui/form-submit/submit.component';
import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';
import { UtilService } from '@app/services/utils.service';

import { ServerSettings } from './server-settings';
import { EmailVerificationDialogComponent, EmailVerificationDialogResult } from './components/email-verification-dialog/email-verification-dialog.component';

import * as _ from 'lodash';

interface BodySettingsType {
  emetti_per_tipi?: string[];
  emetti_per_entita?: string[];
  emetti_per_ruoli?: string[];
};

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.component.html',
  styleUrls: ['profile.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ...COMPONENTS_IMPORTS,
    MarkdownModule,
    InputHelpComponent,
    LnkButtonComponent,
    LnkFormFieldComponent,
    LnkFormErrorComponent,
    LnkFormSubmitComponent
  ]
})
export class ProfileComponent implements OnInit, AfterContentChecked {
  static readonly Name = 'ProfileComponent';
  readonly model: string = 'profile';

  session: any;
  profile: any;
  settings: any;
  serverSettings!: ServerSettings;
  _serverSettings!: any;

  config: any;
  profileConfig: any;

  isProfile: boolean = true;

  isEdit: boolean = false;
  saving: boolean = false;
  formGroup: FormGroup = new FormGroup({});

  error: boolean = false;
  errorMsg: string = '';

  optionsForm: any = null;

  spin: boolean = true;
  desktop: boolean = false;

  _message: string = 'APP.MESSAGE.NoResults';
  _messageHelp: string = 'APP.MESSAGE.NoResultsHelp';
  _messageUnimplemented: string = 'APP.MESSAGE.Unimplemented';

  _error: boolean = false;

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Profile', url: '', type: 'title', iconBs: 'person' }
  ];
  
  _formSettingsSettings: FormGroup = new FormGroup({
    notifiche_inapp: new FormControl(true),
    notifiche_email: new FormControl(false),
    cambio_stato_inapp: new FormControl(false),
    cambio_stato_email: new FormControl(false),
  });

  /**
   * Le opzioni "cambio stato" sono abilitabili solo se almeno una tra
   * notifiche_inapp e notifiche_email è attiva.
   */
  get cambioStatoDisabled(): boolean {
    const inapp = this._formSettingsSettings.get('notifiche_inapp')?.value;
    const email = this._formSettingsSettings.get('notifiche_email')?.value;
    return !inapp && !email;
  }

  /**
   * Verifica se l'utente corrente è un gestore
   */
  get isGestore(): boolean {
    return this.authenticationService.isGestore();
  }

  /**
   * Determina se mostrare la sezione impostazioni notifiche.
   * Visibile per tutti gli utenti autenticati.
   */
  get showNotificationsSettings(): boolean {
    return true;
  }

  // Modal ref per la verifica email
  private modalRef?: BsModalRef;

  // Organizzazioni typeahead
  organizzazioni$!: Observable<any[]>;
  organizzazioniInput$ = new Subject<string>();
  organizzazioniLoading: boolean = false;
  selectedOrganizzazione: any = null;
  minLengthTerm = 1;

  /**
   * Issue 229 evolutiva 2 — id dell'org di partenza scelta
   * dall'utente quando ha >=2 associazioni esistenti. Quando ne
   * ha 1 sola viene auto-popolata silenziosamente in
   * `requestOrganizationChange()` (decisione: silent).
   */
  _selectedOrgPartenzaId: string | null = null;

  // ---------- Multi-org UI state (Issue 229) ----------
  /**
   * Modalita` del form di richiesta attivo:
   * - `null` : nessun form aperto
   * - `'add'` : form "aggiungi organizzazione"
   * - `'replace'` : form "sostituisci organizzazione" (su una
   *   specifica associazione esistente)
   *
   * Solo un form alla volta — l'apertura di un nuovo form chiude
   * eventuali altri. Forms disabilitati globalmente quando
   * `profile.organizzazione_pending` e` valorizzata.
   */
  _orgFormMode: 'add' | 'replace' | null = null;

  /** Id dell'associazione che si sta sostituendo (solo in mode
   *  `replace`). Pre-popolato all'apertura del form. */
  _replaceTargetOrgId: string | null = null;

  // Modal ref per la conferma cambio organizzazione
  private _modalConfirmRef!: BsModalRef;

  get isPendingUpdate(): boolean {
    return this.profile?.stato === 'pending_update';
  }

  /**
   * Issue 229 multi-org — associazioni organizzazione attuali
   * dell'utente. Preferisce `profile.organizzazioni` (multi-org,
   * nuovo schema BE), cade su `profile.organizzazione` (legacy
   * single) wrappata in un array di 1 elemento. Vuoto se nessuna
   * associazione esiste. La forma esposta porta sia i campi
   * dell'organizzazione che `ruolo_organizzazione`, utili nelle
   * card della UI.
   */
  get _orgAssociazioniEsistenti(): Array<{
    id_organizzazione: string;
    nome?: string;
    ruolo_organizzazione?: string | null;
  }> {
    const multi = this.profile?.organizzazioni;
    if (Array.isArray(multi) && multi.length > 0) {
      // Normalizza eventuali shape `{ organizzazione: {...},
      // ruolo_organizzazione: '...' }` (nuovo schema BE) vs piatto
      // (legacy). Preserva sempre il `ruolo_organizzazione` quando
      // disponibile per il rendering nelle card.
      return multi.map((row: any) => {
        const org = row?.organizzazione ?? row;
        return {
          id_organizzazione: org?.id_organizzazione,
          nome: org?.nome,
          ruolo_organizzazione: row?.ruolo_organizzazione ?? null
        };
      }).filter((o: any) => !!o.id_organizzazione);
    }
    const single = this.profile?.organizzazione;
    return single?.id_organizzazione
      ? [{ id_organizzazione: single.id_organizzazione, nome: single.nome, ruolo_organizzazione: null }]
      : [];
  }

  /**
   * True quando va mostrato il selettore di partenza (>=2
   * associazioni). Con 0 o 1 l'utente non sceglie nulla.
   */
  get _showOrgPartenzaSelect(): boolean {
    return this._orgAssociazioniEsistenti.length >= 2;
  }

  // ---------- Multi-org helpers (Issue 229) ----------

  /**
   * True quando l'utente ha gia` una richiesta pendente. Il BE
   * supporta UNA sola richiesta alla volta (decisione 1): finche`
   * non viene approvata/rifiutata, l'utente non puo` aprire
   * nuovi form di add / replace.
   */
  get _hasPendingRequest(): boolean {
    return !!this.profile?.organizzazione_pending;
  }

  /**
   * Etichetta da mostrare nel banner pending. Se
   * `organizzazione_partenza` valorizzata -> e` una sostituzione,
   * mostriamo "Passaggio da X a Y". Altrimenti e` un'aggiunta:
   * mostriamo "Aggiunta di Y".
   */
  get _pendingIsReplace(): boolean {
    return !!this.profile?.organizzazione_partenza?.id_organizzazione;
  }

  /**
   * Stringa markdown gia` tradotta da renderizzare nel banner
   * pending. Estratta in un getter perche` la direttiva
   * `markdown` di ngx-markdown valuta il contenuto del tag come
   * input testuale: con `@if/@else` interni la direttiva non
   * vede i grassetti `**...**` (i template control flow vengono
   * espansi dopo che la direttiva ha gia` parserizzato il
   * contenuto, risultando in markdown non renderizzato).
   * Risolvere la stringa qui e passarla via `[data]` fa il
   * routing corretto.
   */
  get _pendingMessage(): string {
    const key = this._pendingIsReplace
      ? 'APP.PROFILE.ORGANIZATION.PendingReplaceMessage'
      : 'APP.PROFILE.ORGANIZATION.PendingAddMessage';
    return this.translate.instant(key, {
      partenza: this.profile?.organizzazione_partenza?.nome,
      destinazione: this.profile?.organizzazione_pending?.nome
    });
  }

  /**
   * Apre il form di aggiunta. Disabilita azione se esiste un
   * pending.
   */
  _openAddOrgForm(): void {
    if (this._hasPendingRequest) { return; }
    this._orgFormMode = 'add';
    this._replaceTargetOrgId = null;
    this._selectedOrgPartenzaId = null;
    this.selectedOrganizzazione = null;
    // re-init typeahead per filtrare le org gia` associate
    this._initOrganizzazioniSelect([]);
  }

  /**
   * Apre il form di sostituzione su una specifica associazione.
   * `partenzaId` viene pre-popolato e usato come
   * `id_organizzazione_partenza` nel payload.
   */
  _openReplaceOrgForm(partenzaId: string): void {
    if (this._hasPendingRequest) { return; }
    this._orgFormMode = 'replace';
    this._replaceTargetOrgId = partenzaId;
    this._selectedOrgPartenzaId = partenzaId;
    this.selectedOrganizzazione = null;
    this._initOrganizzazioniSelect([]);
  }

  /** Chiude qualsiasi form aperto (annulla). */
  _closeOrgForm(): void {
    this._orgFormMode = null;
    this._replaceTargetOrgId = null;
    this._selectedOrgPartenzaId = null;
    this.selectedOrganizzazione = null;
  }

  // Getter per verificare se la verifica email è abilitata
  get verificaEmailAbilitata(): boolean {
    return Tools.Configurazione?.utente?.profilo_modifica_email_richiede_verifica === true;
  }

  // Getter per verificare se mostrare il campo email (default: false = nascosto)
  get mostraEmail(): boolean {
    return this.config?.AppConfig?.Profile?.showEmail === true;
  }

  // Getter per verificare se mostrare il campo telefono (default: false = nascosto)
  get mostraTelefono(): boolean {
    return this.config?.AppConfig?.Profile?.showPhone === true;
  }

  constructor(
    private readonly router: Router,
    protected fb: FormBuilder,
    private readonly configService: ConfigService,
    public tools: Tools,
    public apiService: OpenAPIService,
    public authenticationService: AuthenticationService,
    private readonly utils: UtilService,
    private readonly modalService: BsModalService,
    private readonly translate: TranslateService
  ) {
    this.config = this.configService.getConfiguration();
  }

  @HostListener('window:resize') _onResize() {
    this.desktop = (window.innerWidth >= 992);
  }

  ngOnInit() {
    this.configService.getConfig(this.model).subscribe(
      (config: any) => {
        this.profileConfig = config;

        this.session = this.authenticationService.getCurrentSession();

        this.loadProfile();
      }
    );
  }

  ngAfterContentChecked(): void {
    this.desktop = (window.innerWidth >= 992);
  }

  loadProfile() {
    this.spin = true;
    this.apiService.getList('profilo').subscribe(
      (response: any) => {

        this.profile = response.utente;

        // I settings UI sono salvati nella sessione locale, non nell'API /profilo
        // Priorità: sessione locale > API > default
        const sessionSettings = this.authenticationService.getSettings();
        const apiSettings = response.settings;
        this.settings = this._initializeSettings(sessionSettings, apiSettings);

        this.initForm();

        const defaultOrg = this.profile?.organizzazione ? [this.profile.organizzazione] : [];
        this.selectedOrganizzazione = this.profile?.organizzazione || null;
        this._initOrganizzazioniSelect(defaultOrg);

        this.loadSettingsNotifications();

        this.spin = false;
      }
    );
  }

  /**
   * Inizializza i settings con valori di default se mancanti.
   * Priorità: sessionSettings > apiSettings > default
   */
  private _initializeSettings(sessionSettings: any, apiSettings: any): any {
    const defaultSettings = {
      version: '0.1',
      servizi: {
        view: 'card',
        viewBoxed: false,
        showImage: true,
        showEmptyImage: false,
        fillBox: true,
        showMasonry: false,
        editSingleColumn: false,
        showMarkdown: true,
        showPresentation: true,
        showTechnicalReferent: false
      }
    };

    // Usa sessionSettings se disponibili (priorità più alta)
    const settings = sessionSettings && Object.keys(sessionSettings).length > 0
      ? sessionSettings
      : apiSettings;

    if (!settings || Object.keys(settings).length === 0) {
      return defaultSettings;
    }

    // Merge con i default per garantire che servizi esista
    return {
      ...defaultSettings,
      ...settings,
      servizi: {
        ...defaultSettings.servizi,
        ...(settings.servizi || {})
      }
    };
  }

  _setErrorMessages(error: boolean) {
    this._error = error;
    if (this._error) {
      this._message = 'APP.MESSAGE.ERROR.Default';
      this._messageHelp = 'APP.MESSAGE.ERROR.DefaultHelp';
    } else {
      this._message = 'APP.MESSAGE.NoResults';
      this._messageHelp = 'APP.MESSAGE.NoResultsHelp';
    }
  }

  onBreadcrumb(event: any) {
    this.router.navigate([event.url]);
  }

  onEdit() {
    this.isEdit = true;
    this.error = false;
    this.errorMsg = '';
  }

  onCancelEdit() {
    this.isEdit = false;
    this.error = false;
    this.errorMsg = '';
    this.selectedOrganizzazione = this.profile?.organizzazione || null;
    this.initForm();
  }

  initForm() {
    // Se verifica email abilitata, i campi email sono disabilitati
    const emailDisabled = this.verificaEmailAbilitata;

    this.formGroup = this.fb.group({
        principal: [{value: '', disabled: true}, [Validators.required]],
        nome: ['', [Validators.required]],
        cognome: ['', [Validators.required]],
        telefono: ['', []],
        email: [{value: '', disabled: emailDisabled}, [Validators.email]],
        telefono_aziendale: ['', [Validators.required]],
        email_aziendale: [{value: '', disabled: emailDisabled}, [Validators.required, Validators.email]],
        note: ['', []],
    });

    this.formGroup.patchValue(this.profile);
  }

  submitProfile(formValue: any) {
    if (this.isEdit && this.formGroup.valid) {
      // Procedi con l'update del profilo
      // Nota: le email sono gestite separatamente quando verifica è abilitata
      this.onUpdateProfile(this.profile.id_utente, formValue);
    }
  }

  /**
   * Apre il dialog per modificare un campo email con verifica OTP
   */
  openEmailModificationDialog(fieldName: 'email' | 'email_aziendale'): void {
    const currentEmail = this.profile?.[fieldName] || '';

    const initialState = {
      currentEmail: currentEmail,
      fieldName: fieldName
    };

    this.modalRef = this.modalService.show(EmailVerificationDialogComponent, {
      initialState,
      class: 'modal-md',
      backdrop: 'static',
      keyboard: false
    });

    // Sottoscrivi all'evento di chiusura del modal
    this.modalRef.onHidden?.subscribe(() => {
      const result: EmailVerificationDialogResult = this.modalRef?.content?.result;
      if (result?.verified && result?.verifiedEmail && result?.fieldName) {
        // Verifica completata con successo
        // Aggiorna il formGroup con la nuova email
        this.formGroup.get(result.fieldName)?.setValue(result.verifiedEmail);
        // Aggiorna anche il profilo locale
        this.profile[result.fieldName] = result.verifiedEmail;
        Tools.showMessage(this.translate.instant('APP.MESSAGE.EmailModified'), 'success');
      } else if (result?.clearEmail && result?.fieldName === 'email') {
        // Rimozione email personale senza verifica OTP
        this.clearPersonalEmail();
      }
    });
  }

  /**
   * Rimuove l'email personale chiamando direttamente PUT /profilo
   * Il payload deve contenere tutti i campi incluso email_aziendale
   */
  private clearPersonalEmail(): void {
    const formValue = this.formGroup.getRawValue();
    const body = {
      nome: formValue.nome,
      cognome: formValue.cognome,
      telefono: formValue.telefono || null,
      telefono_aziendale: formValue.telefono_aziendale,
      email: null, // Rimuovi email personale
      email_aziendale: formValue.email_aziendale || this.profile?.email_aziendale,
      note: formValue.note || null
    };

    this.apiService.putElement('profilo', null, body).subscribe({
      next: (response: any) => {
        // Aggiorna il formGroup con email vuota
        this.formGroup.get('email')?.setValue('');
        // Aggiorna anche il profilo locale
        this.profile.email = null;
        Tools.showMessage(this.translate.instant('APP.MESSAGE.EmailRemoved'), 'success');
      },
      error: (error: any) => {
        this.error = true;
        this.errorMsg = this.utils.GetErrorMsg(error);
      }
    });
  }

  prepareBodyUpdate(body: any) {
    // Il payload include sempre tutti i campi, incluse le email.
    // Il BE verificherà che le email non siano state modificate se la verifica è abilitata
    // e restituirà errore UT_403_EMAIL_CHANGE in caso di incongruenza.
    const _body: any = {
      nome: body.nome,
      cognome: body.cognome,
      telefono: body.telefono || null,
      telefono_aziendale: body.telefono_aziendale,
      email: body.email || this.profile?.email || null,
      email_aziendale: body.email_aziendale || this.profile?.email_aziendale,
      note: body.note || null
    };

    return _body;
  }

  onUpdateProfile(id: string, body: any) {
    const _body = this.prepareBodyUpdate(body);

    this.apiService.putElement('profilo', null, _body).subscribe({
      next: (response: any) => {
        Tools.showMessage(this.translate.instant('APP.MESSAGE.ProfileSaved'), 'success');
        this.loadProfile();
        this.onCancelEdit();
      },
      error: (error: any) => {
        this.error = true;
        this.errorMsg = this.utils.GetErrorMsg(error);
      }
    })
  }

  _showProfile() {
    this.isProfile = true;
  }

  _showSettings() {
    this.isProfile = false;
  }

  loadSettingsNotifications() {
    this.apiService.getDetails('utenti', this.profile.id_utente, 'settings/notifiche').subscribe({
      next: (response: any) => {
        console.log('loadSettingsNotifications', response);
        this._serverSettings = { ...response };
        this.serverSettings = new ServerSettings({ ...response });
        this._initServerForm({ ...this.serverSettings });
      },
      error: () => {
        // In caso di errore, inizializza il form con tutto abilitato (default)
        console.log('loadSettingsNotifications error, using defaults');
        this._serverSettings = {};
        this.serverSettings = new ServerSettings({});
        this._initServerForm({});
      }
    });
  }

  _updateSettings(event: any, field: string) {
    switch (field) {
      case 'servizi_showmasonry':
        this.settings.servizi.showEmptyImage = false;
        break;
      default:
        break;
    }

    this.authenticationService.saveSettings({
      servizi: {
        view: this.settings.servizi.view,

        viewBoxed: this.settings.servizi.viewBoxed,
        showImage: this.settings.servizi.showImage,
        showEmptyImage: this.settings.servizi.showEmptyImage,
        fillBox: this.settings.servizi.fillBox,
        showMasonry: this.settings.servizi.showMasonry,
      
        editSingleColumn: this.settings.servizi.editSingleColumn,
        showMarkdown: this.settings.servizi.showMarkdown,
        showPresentation: this.settings.servizi.showPresentation,
        showTechnicalReferent: this.settings.servizi.showTechnicalReferent
      }
    });
  }

  /**
   * Inizializza il form delle impostazioni notifiche.
   * Mappa dal formato API (emetti_per_tipi array) ai 4 toggle booleani.
   */
  _initServerForm(data: any = null) {
    const tipi: string[] = data?.emetti_per_tipi;

    // Se undefined = tutto abilitato (default), se [] = tutto disabilitato
    const allEnabled = tipi === undefined;
    const notifiche_inapp = allEnabled || (tipi?.includes('comunicazione') ?? false);
    const notifiche_email = allEnabled ? false : (tipi?.includes('comunicazione_email') ?? false);
    const cambio_stato_inapp = allEnabled ? false : (tipi?.includes('cambio_stato') ?? false);
    const cambio_stato_email = allEnabled ? false : (tipi?.includes('cambio_stato_email') ?? false);

    this._formSettingsSettings = new FormGroup({
      notifiche_inapp: new FormControl(notifiche_inapp),
      notifiche_email: new FormControl(notifiche_email),
      cambio_stato_inapp: new FormControl(cambio_stato_inapp),
      cambio_stato_email: new FormControl(cambio_stato_email),
    });

    this._updateCambioStatoState();
    this._formSettingsSettings.updateValueAndValidity();

    // Quando notifiche_inapp o notifiche_email cambiano, aggiorna lo stato di cambio_stato
    this._formSettingsSettings.get('notifiche_inapp')?.valueChanges.subscribe(() => this._updateCambioStatoState());
    this._formSettingsSettings.get('notifiche_email')?.valueChanges.subscribe(() => this._updateCambioStatoState());

    // Sottoscrizione ai cambiamenti del form per salvare
    this._formSettingsSettings.valueChanges.subscribe(() => {
      this._updateServerSettings(this._formSettingsSettings.value);
    });
  }

  /**
   * Abilita/disabilita i toggle cambio_stato in base allo stato di notifiche_inapp/email.
   * Se entrambi sono off, disabilita e resetta cambio_stato.
   */
  private _updateCambioStatoState() {
    const disabled = this.cambioStatoDisabled;
    const csInapp = this._formSettingsSettings.get('cambio_stato_inapp');
    const csEmail = this._formSettingsSettings.get('cambio_stato_email');

    if (disabled) {
      csInapp?.setValue(false, { emitEvent: false });
      csEmail?.setValue(false, { emitEvent: false });
      csInapp?.disable({ emitEvent: false });
      csEmail?.disable({ emitEvent: false });
    } else {
      csInapp?.enable({ emitEvent: false });
      csEmail?.enable({ emitEvent: false });
    }
  }

  /**
   * Verifica se le notifiche sono globalmente abilitate
   */
  get notificationsEnabled(): boolean {
    const v = this._formSettingsSettings?.getRawValue();
    return v?.notifiche_inapp || v?.notifiche_email || v?.cambio_stato_inapp || v?.cambio_stato_email;
  }

  _preventMultiCall: boolean = false;

  _updateServerSettings(body: any) {
    if (!this._preventMultiCall) {
      this._preventMultiCall = true;
      const _body = this._prepareBody(body);

      this.apiService.putElementRelated('utenti', this.profile.id_utente, 'settings/notifiche', _body).subscribe({
        next: (response: any) => {
          console.log('_updateServerSettings', response);
          this._serverSettings = { ...response };
          this._preventMultiCall = false;
        },
        error: () => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
        }
      });
    }
  }

  /**
   * Prepara il body per l'API.
   *
   * Logica:
   * - Se tutti i checkbox di una sezione sono selezionati → non inviamo quella sezione (= tutto abilitato)
   * - Se nessun checkbox è selezionato → inviamo [] (= tutto disabilitato)
   * - Altrimenti inviamo l'array con i valori selezionati
   */
  /**
   * Mappa i 4 toggle booleani nel formato API emetti_per_tipi.
   */
  _prepareBody(body: any): BodySettingsType {
    const _body: BodySettingsType = {};
    const tipi: string[] = [];

    if (body.notifiche_inapp) tipi.push('comunicazione');
    if (body.notifiche_email) tipi.push('comunicazione_email');
    if (body.cambio_stato_inapp) tipi.push('cambio_stato');
    if (body.cambio_stato_email) tipi.push('cambio_stato_email');

    _body.emetti_per_tipi = tipi;
    return _body;
  }

  _onSubmit(form: any) {
    this._updateServerSettings(form);
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

  getOrganizzazioni(term: string | null = null): Observable<any> {
    const _options: any = { params: { q: term } };
    return this.apiService.getList('organizzazioni', _options)
      .pipe(map(resp => {
        if (resp.Error) {
          throwError(() => resp.Error);
        } else {
          // Issue 229 multi-org: nei form di add/replace nascondiamo
          // le organizzazioni gia` associate (evita request duplicate
          // che il BE rifiuterebbe). In `replace` consentiamo invece
          // la riga di partenza (e` quella che stiamo sostituendo —
          // l'utente vuole proprio cambiarla con un'altra).
          const excludedIds = new Set<string>(
            this._orgAssociazioniEsistenti
              .map((o: any) => o?.id_organizzazione)
              .filter((id: string | null): id is string => !!id)
          );
          if (this._orgFormMode === 'replace' && this._replaceTargetOrgId) {
            excludedIds.delete(this._replaceTargetOrgId);
          }
          const _items = resp.content.filter(
            (item: any) => !excludedIds.has(item?.id_organizzazione)
          );
          return _items;
        }
      })
      );
  }

  /**
   * Issue 229 multi-org — richiesta verso `PUT /profilo/organizzazione`.
   *
   * @param selectedOrgId id dell'organizzazione target richiesta.
   * @param partenzaOrgId opzionale; quando presente -> SOSTITUZIONE
   *   (il BE rimpiazza quell'associazione con la nuova). Quando
   *   assente -> AGGIUNTA (nuova associazione aggiunta a quelle
   *   esistenti). Il `_orgFormMode` corrente determina il flusso e
   *   l'eventuale i18n del warning.
   */
  requestOrganizationChange(selectedOrgId: string, partenzaOrgId?: string | null) {
    if (this._hasPendingRequest) {
      // safety net: il bottone dovrebbe gia` essere disabilitato.
      return;
    }
    const isAdd = !partenzaOrgId;
    const titleKey = isAdd
      ? 'APP.PROFILE.ORGANIZATION.AddTitle'
      : 'APP.PROFILE.ORGANIZATION.ChangeTitle';
    const warningKey = isAdd
      ? 'APP.PROFILE.ORGANIZATION.AddWarning'
      : 'APP.PROFILE.ORGANIZATION.ChangeWarningWithOrg';
    const initialState = {
      title: this.translate.instant(titleKey),
      messages: [
        this.translate.instant(warningKey)
      ],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.BUTTON.Confirm'),
      confirmColor: isAdd ? 'confirm' : 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          // Payload `ProfiloOrganizationUpdate`:
          //  - `id_organizzazione` sempre presente (target)
          //  - `id_organizzazione_partenza` SEMPRE presente nel
          //    payload, ma con valore `null` per il flusso di
          //    AGGIUNTA (utente con ≥1 associazione che vuole
          //    aggiungerne una nuova senza sostituire). Con il
          //    field omesso, il BE rispondeva
          //    `UT.400.ORG.PARTENZA.REQUIRED`: il null esplicito
          //    e` il marker dell'add. Per il REPLACE il valore
          //    porta l'id dell'associazione da sostituire.
          const payload: any = {
            id_organizzazione: selectedOrgId,
            id_organizzazione_partenza: partenzaOrgId ?? null
          };

          this.apiService.putElement('profilo/organizzazione', null, payload).subscribe({
            next: (_response: any) => {
              Tools.showMessage(this.translate.instant('APP.PROFILE.ORGANIZATION.RequestSent'), 'success');
              this._closeOrgForm();
              this.loadProfile();
            },
            error: (error: any) => {
              this.error = true;
              this.errorMsg = this.utils.GetErrorMsg(error);
            }
          });
        }
      }
    );
  }

  /**
   * Issue 229 evolutiva 3 — annulla la richiesta di cambio
   * organizzazione pendente. `DELETE /profilo/organizzazione`
   * non ha body; risposta = `Utente` aggiornato.
   *
   * Stato post-annullamento (BE):
   * - utente con associazioni esistenti -> `abilitato`;
   * - utente nuovo da first-login (nessuna associazione) ->
   *   `non_configurato`.
   *
   * Visibile solo quando `isPendingUpdate && _hasPendingRequest`.
   */
  cancelOrganizationChange(): void {
    if (!this._hasPendingRequest) {
      // safety net.
      return;
    }
    const initialState = {
      title: this.translate.instant('APP.PROFILE.ORGANIZATION.CancelTitle'),
      messages: [this.translate.instant('APP.PROFILE.ORGANIZATION.CancelWarning')],
      cancelText: this.translate.instant('APP.BUTTON.Cancel'),
      confirmText: this.translate.instant('APP.PROFILE.ORGANIZATION.CancelButton'),
      confirmColor: 'danger'
    };

    this._modalConfirmRef = this.modalService.show(YesnoDialogBsComponent, {
      ignoreBackdropClick: true,
      initialState: initialState
    });
    this._modalConfirmRef.content.onClose.subscribe(
      (response: any) => {
        if (response) {
          this.apiService.deleteElement('profilo/organizzazione', null).subscribe({
            next: (_response: any) => {
              Tools.showMessage(this.translate.instant('APP.PROFILE.ORGANIZATION.RequestCancelled'), 'success');
              this.loadProfile();
            },
            error: (error: any) => {
              this.error = true;
              this.errorMsg = this.utils.GetErrorMsg(error);
            }
          });
        }
      }
    );
  }

  /**
   * Conferma dal form attivo (`_orgFormMode`). Branch su
   * add/replace e chiama `requestOrganizationChange` con il
   * giusto `partenzaOrgId`.
   */
  _confirmOrgForm(): void {
    const targetId = this.selectedOrganizzazione?.id_organizzazione;
    if (!targetId) { return; }
    if (this._orgFormMode === 'replace') {
      this.requestOrganizationChange(targetId, this._replaceTargetOrgId);
    } else {
      this.requestOrganizationChange(targetId, null);
    }
  }

  onAvatarError(event: any) {
    event.target.src = './assets/images/avatar.png'
  }
}
