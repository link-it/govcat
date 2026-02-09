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
import { Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { TranslateService } from '@ngx-translate/core';

import { Tools, ConfigService } from '@linkit/components';
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
  standalone: false
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
  
  // Opzioni per tipi di notifica (ogni elemento ha versione in-app e _email)
  _emetti_per_tipi: { label: string; value: string }[] = [
    { label: 'APP.NOTIFICATIONS.TYPE.Comunicazione', value: 'comunicazione' },
    { label: 'APP.NOTIFICATIONS.TYPE.CambioStato', value: 'cambio_stato' }
  ];

  // Opzioni per entità
  _emetti_per_entita: { label: string; value: string }[] = [
    { label: 'APP.NOTIFICATIONS.ENTITY.Servizio', value: 'servizio' },
    { label: 'APP.NOTIFICATIONS.ENTITY.Adesione', value: 'adesione' }
  ];

  // Opzioni per ruoli
  _emetti_per_ruoli: { label: string; value: string }[] = [
    { label: 'APP.NOTIFICATIONS.TAG.ServizioReferenteDominio', value: 'servizio_referente_dominio' },
    { label: 'APP.NOTIFICATIONS.TAG.ServizioReferenteTecnicoDominio', value: 'servizio_referente_tecnico_dominio' },
    { label: 'APP.NOTIFICATIONS.TAG.ServizioReferenteServizio', value: 'servizio_referente_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.ServizioReferenteTecnicoServizio', value: 'servizio_referente_tecnico_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.ServizioRichiedenteServizio', value: 'servizio_richiedente_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteDominio', value: 'adesione_referente_dominio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteTecnicoDominio', value: 'adesione_referente_tecnico_dominio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteServizio', value: 'adesione_referente_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteTecnicoServizio', value: 'adesione_referente_tecnico_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneRichiedenteServizio', value: 'adesione_richiedente_servizio' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteAdesione', value: 'adesione_referente_adesione' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneReferenteTecnicoAdesione', value: 'adesione_referente_tecnico_adesione' },
    { label: 'APP.NOTIFICATIONS.TAG.AdesioneRichiedenteAdesione', value: 'adesione_richiedente_adesione' },
  ];

  _formSettingsSettings: FormGroup = new FormGroup({
    emetti_per_tipi: new FormControl([], []),
    emetti_per_entita: new FormControl([], []),
    emetti_per_ruoli: new FormControl([], []),
  });

  // DEBUG: impostare a false per nascondere le notifiche al gestore (comportamento finale)
  _debugShowNotificationsForGestore: boolean = true;

  /**
   * Verifica se l'utente corrente è un gestore
   */
  get isGestore(): boolean {
    return this.authenticationService.isGestore();
  }

  /**
   * Determina se mostrare la sezione impostazioni notifiche.
   * Il gestore non dovrebbe vedere questa sezione (le notifiche sono sostituite dalla dashboard).
   * Il flag _debugShowNotificationsForGestore permette di abilitarla temporaneamente per test.
   */
  get showNotificationsSettings(): boolean {
    if (this.isGestore) {
      return this._debugShowNotificationsForGestore;
    }
    return true;
  }

  // Modal ref per la verifica email
  private modalRef?: BsModalRef;

  // Getter per verificare se la verifica email è abilitata
  get verificaEmailAbilitata(): boolean {
    return Tools.Configurazione?.utente?.profilo_modifica_email_richiede_verifica === true;
  }

  // Getter per verificare se mostrare il campo email (default: false = nascosto)
  get mostraEmail(): boolean {
    return this.config?.AppConfig?.Profile?.showEmail === true;
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
   *
   * Logica:
   * - {} o sezione undefined = tutto abilitato per quella sezione
   * - [] = tutto disabilitato per quella sezione
   * - Array con valori = solo quei valori abilitati
   * - Ogni elemento ha versione in-app (base) e email (_email suffix)
   */
  _initServerForm(data: any = null) {
    console.log('_initServerForm', data);

    // Determina i valori iniziali per ogni sezione
    // Se undefined, consideriamo tutto abilitato (tutti i valori possibili)
    const tipiValues = this._getInitialValues(data?.emetti_per_tipi, this._emetti_per_tipi);
    const entitaValues = this._getInitialValues(data?.emetti_per_entita, this._emetti_per_entita);
    const ruoliValues = this._getInitialValues(data?.emetti_per_ruoli, this._emetti_per_ruoli);

    this._formSettingsSettings = new FormGroup({
      emetti_per_tipi: new FormControl(tipiValues, []),
      emetti_per_entita: new FormControl(entitaValues, []),
      emetti_per_ruoli: new FormControl(ruoliValues, []),
    });

    this._formSettingsSettings.updateValueAndValidity();

    // Sottoscrizione ai cambiamenti del form
    this._formSettingsSettings.valueChanges.subscribe((body: any) => {
      this._updateServerSettings(body);
    });
  }

  /**
   * Determina i valori iniziali per una sezione.
   * Se data è undefined → tutto abilitato (ritorna tutti i valori possibili con _email)
   * Se data è [] → tutto disabilitato (ritorna [])
   * Altrimenti → ritorna i valori presenti
   */
  private _getInitialValues(data: string[] | undefined, options: { value: string }[]): string[] {
    if (data === undefined) {
      // Tutto abilitato: genera tutti i valori (base + _email)
      const allValues: string[] = [];
      options.forEach(opt => {
        allValues.push(opt.value);
        allValues.push(`${opt.value}_email`);
      });
      return allValues;
    }
    return data || [];
  }

  /**
   * Verifica se le notifiche sono globalmente abilitate (almeno un checkbox selezionato)
   */
  get notificationsEnabled(): boolean {
    const tipi = this._formSettingsSettings?.get('emetti_per_tipi')?.value || [];
    const entita = this._formSettingsSettings?.get('emetti_per_entita')?.value || [];
    const ruoli = this._formSettingsSettings?.get('emetti_per_ruoli')?.value || [];
    return tipi.length > 0 || entita.length > 0 || ruoli.length > 0;
  }

  /**
   * Abilita o disabilita tutte le notifiche
   */
  toggleAllNotifications(enabled: boolean) {
    if (enabled) {
      // Abilita tutto: genera tutti i valori possibili per ogni sezione
      const allTipi = this._getAllValues(this._emetti_per_tipi);
      const allEntita = this._getAllValues(this._emetti_per_entita);
      const allRuoli = this._getAllValues(this._emetti_per_ruoli);

      this._formSettingsSettings.patchValue({
        emetti_per_tipi: allTipi,
        emetti_per_entita: allEntita,
        emetti_per_ruoli: allRuoli
      });
    } else {
      // Disabilita tutto: array vuoti
      this._formSettingsSettings.patchValue({
        emetti_per_tipi: [],
        emetti_per_entita: [],
        emetti_per_ruoli: []
      });
    }
  }

  /**
   * Genera tutti i valori possibili per una sezione (base + _email)
   */
  private _getAllValues(options: { value: string }[]): string[] {
    const allValues: string[] = [];
    options.forEach(opt => {
      allValues.push(opt.value);
      allValues.push(`${opt.value}_email`);
    });
    return allValues;
  }

  /**
   * Verifica se un valore è selezionato nell'array del form
   */
  isValueSelected(fieldName: string, value: string): boolean {
    const values = this._formSettingsSettings?.get(fieldName)?.value || [];
    return values.includes(value);
  }

  /**
   * Toggle di un valore nell'array del form
   */
  toggleValue(fieldName: string, value: string, checked: boolean) {
    const control = this._formSettingsSettings.get(fieldName);
    if (!control) return;

    let values: string[] = [...(control.value || [])];

    if (checked) {
      if (!values.includes(value)) {
        values.push(value);
      }
    } else {
      values = values.filter(v => v !== value);
    }

    control.setValue(values);
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
  _prepareBody(body: any): BodySettingsType {
    const _body: BodySettingsType = {};

    // Per ogni sezione, determina cosa inviare
    _body.emetti_per_tipi = this._prepareSection(body.emetti_per_tipi, this._emetti_per_tipi);
    _body.emetti_per_entita = this._prepareSection(body.emetti_per_entita, this._emetti_per_entita);
    _body.emetti_per_ruoli = this._prepareSection(body.emetti_per_ruoli, this._emetti_per_ruoli);

    return _body;
  }

  /**
   * Prepara una sezione per l'invio.
   * Ritorna undefined se tutto abilitato, [] se tutto disabilitato, altrimenti i valori.
   */
  private _prepareSection(values: string[] | undefined, options: { value: string }[]): string[] | undefined {
    if (!values) return [];

    // Calcola tutti i valori possibili (base + _email)
    const allPossible = options.length * 2;

    if (values.length === 0) {
      return []; // Tutto disabilitato
    }

    if (values.length === allPossible) {
      return undefined; // Tutto abilitato - non inviamo la sezione
    }

    return values; // Valori specifici
  }

  _onSubmit(form: any) {
    this._updateServerSettings(form);
  }

  onAvatarError(event: any) {
    event.target.src = './assets/images/avatar.png'
  }
}
