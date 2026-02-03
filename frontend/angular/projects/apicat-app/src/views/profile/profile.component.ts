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
  
  _emetti_per_tipi: any[] = [
    { label: 'APP.NOTIFICATIONS.TYPE.Comunicazione', value: 'comunicazione' },
    { label: 'APP.NOTIFICATIONS.TYPE.CambioStato', value: 'cambio_stato' }
  ];
  _emetti_per_entita: any[] = [
    { label: 'APP.NOTIFICATIONS.ENTITY.Servizio', value: 'servizio' },
    { label: 'APP.NOTIFICATIONS.ENTITY.Adesione', value: 'adesione' }
  ];
  _emetti_per_ruoli: any[] = [
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

  _formSettingsSettings!: FormGroup;

  // Modal ref per la verifica email
  private modalRef?: BsModalRef;

  // Getter per verificare se la verifica email è abilitata
  get verificaEmailAbilitata(): boolean {
    return Tools.Configurazione?.utente?.profilo_modifica_email_richiede_verifica === true;
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
        this.settings = response.settings;

        this.initForm();

        this.loadSettingsNotifications();

        this.spin = false;
      }
    );
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
      error: (error: any) => {
        this._setErrorMessages(true);
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

  _initServerForm(data: any = null) {
    console.log('_initServerForm', data);
    if (data) {
      let _group: any = {};
      Object.keys(data).forEach((key) => {
        let value = '';
        switch (key) {
          case 'emetti_per_tipi': {
            const _emetti_per_tipi: any[] = data['emetti_per_tipi'] || [];
            _group[key] = new FormControl(_emetti_per_tipi, []);
            break;
          }
          case 'emetti_per_entita': {
            const _emetti_per_entita: any[] = data['emetti_per_entita'] || [];
            _group[key] = new FormControl(_emetti_per_entita, []);
            break;
          }
          case 'emetti_per_ruoli': {
            const _emetti_per_ruoli: any[] = data['emetti_per_ruoli'] || [];
            _group[key] = new FormControl(_emetti_per_ruoli, []);
            break;
          }
          default:
            value = data[key] ? data[key] : null;
            _group[key] = new FormControl(value, []);
            break;
        }
      });
      this._formSettingsSettings = new FormGroup(_group);

      if (data.emetti_per_tipi || data.emetti_per_tipi || data.emetti_per_tipi) {
        this._formSettingsSettings.get('enable_notifications')?.setValue(true, {emitEvent: false});
      } else {
        this._formSettingsSettings.get('enable_notifications')?.setValue(false, {emitEvent: true});
      }

      if (data.emetti_per_tipi) {
        if (data.emetti_per_tipi.length) {
          this._formSettingsSettings.get('emetti_per_tipi_for_all')?.setValue(null, {emitEvent: false});
        } else {
          this._formSettingsSettings.get('emetti_per_tipi_for_all')?.setValue(true, {emitEvent: false});
        }
      } else {
        this._formSettingsSettings.get('emetti_per_tipi_for_all')?.setValue(false, {emitEvent: false});
      }
      if (data.emetti_per_entita) {
        if (data.emetti_per_entita.length) {
          this._formSettingsSettings.get('emetti_per_entita_for_all')?.setValue(null, {emitEvent: false});
        } else {
          this._formSettingsSettings.get('emetti_per_entita_for_all')?.setValue(true, {emitEvent: false});
        }
      } else {
        this._formSettingsSettings.get('emetti_per_entita_for_all')?.setValue(false, {emitEvent: false});
      }
      if (data.emetti_per_ruoli) {
        if (data.emetti_per_ruoli.length) {
          this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.setValue(null, {emitEvent: false});
        } else {
          this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.setValue(true, {emitEvent: false});
        }
      } else {
        this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.setValue(false, {emitEvent: false});
      }
      this._formSettingsSettings.updateValueAndValidity();
    }

    this._formSettingsSettings.valueChanges.subscribe((body: any) => {
      this._updateServerSettings(body);
    });

    this._formSettingsSettings.get('enable_notifications')?.valueChanges.subscribe((value: any) => {
      if (value) {
        this._formSettingsSettings.get('emetti_per_tipi')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_tipi')?.enable();
        this._formSettingsSettings.get('emetti_per_tipi_for_all')?.setValue(true, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_tipi_for_all')?.enable();

        this._formSettingsSettings.get('emetti_per_entita')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_entita')?.enable();
        this._formSettingsSettings.get('emetti_per_entita_for_all')?.setValue(true, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_entita_for_all')?.enable();

        this._formSettingsSettings.get('emetti_per_ruoli')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_ruoli')?.enable();
        this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.setValue(true, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.enable();
      } else {
        this._formSettingsSettings.get('emetti_per_tipi')?.setValue([], {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_tipi')?.disable();
        this._formSettingsSettings.get('emetti_per_tipi_for_all')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_tipi_for_all')?.disable();

        this._formSettingsSettings.get('emetti_per_entita')?.setValue([], {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_entita')?.disable();
        this._formSettingsSettings.get('emetti_per_entita_for_all')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_entita_for_all')?.disable();

        this._formSettingsSettings.get('emetti_per_ruoli')?.setValue([], {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_ruoli')?.disable();
        this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.setValue(null, {emitEvent: false});
        this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.disable();
      }
    });
    this._formSettingsSettings.get('emetti_per_tipi')?.valueChanges.subscribe((value: any) => {
      this.__updateFormEmetti('emetti_per_tipi', value, this._emetti_per_tipi.length);
    });
    this._formSettingsSettings.get('emetti_per_tipi_for_all')?.valueChanges.subscribe((value: any) => {
      if (value) {
        this._formSettingsSettings.get('emetti_per_tipi')?.setValue([], {emitEvent: false});
      }
    });

    this._formSettingsSettings.get('emetti_per_entita')?.valueChanges.subscribe((value: any) => {
      this.__updateFormEmetti('emetti_per_entita', value, this._emetti_per_entita.length);
    });
    this._formSettingsSettings.get('emetti_per_entita_for_all')?.valueChanges.subscribe((value: any) => {
      if (value) {
        this._formSettingsSettings.get('emetti_per_entita')?.setValue([], {emitEvent: false});
      }
    });

    this._formSettingsSettings.get('emetti_per_ruoli')?.valueChanges.subscribe((value: any) => {
      this.__updateFormEmetti('emetti_per_ruoli', value, this._emetti_per_ruoli.length);
    });
    this._formSettingsSettings.get('emetti_per_ruoli_for_all')?.valueChanges.subscribe((value: any) => {
      if (value) {
        this._formSettingsSettings.get('emetti_per_ruoli')?.setValue([], {emitEvent: false});
      }
    });
  }

  __updateFormEmetti(name: string, value: any, total: number) {
    const _nameForAll = `${name}_for_all`;
    if (value && value.length) {
      this._formSettingsSettings.get(_nameForAll)?.setValue(null, {emitEvent: false});
      if (value.length === total) {
        this._formSettingsSettings.get(_nameForAll)?.setValue(true, {emitEvent: false});
        this._formSettingsSettings.get(name)?.setValue([], {emitEvent: false});
      }
    } else {
      this._formSettingsSettings.get(_nameForAll)?.setValue(true, {emitEvent: false});
    }
  }

  _preventMultiCall: boolean = false;

  _updateServerSettings(body: any) {
    if (!this._preventMultiCall) {
      this._preventMultiCall = true;
      const _body = this._prepareBody(body);

      this._preventMultiCall = true;
      this.apiService.putElementRelated('utenti', this.profile.id_utente, 'settings/notifiche', _body).subscribe({
        next: (response: any) => {
          console.log('_updateServerSettings', response);
          this.serverSettings = { ...response };
          this._serverSettings = { ...response };
          this._preventMultiCall = false;
        },
        error: (error: any) => {
          this._setErrorMessages(true);
          this._preventMultiCall = false;
        }
      });
    }
  }

  _prepareBody(body: any) {
    let _body: BodySettingsType = {};
    const _enable_notifications = body.enable_notifications;

    if (_enable_notifications) {
      if (!body.emetti_per_tipi_for_all && body.emetti_per_tipi) {
        _body.emetti_per_tipi = [ ...body.emetti_per_tipi ];
      }
      if (!body.emetti_per_entita_for_all && body.emetti_per_entita) {
        _body.emetti_per_entita = [ ...body.emetti_per_entita ];
      }
      if (!body.emetti_per_ruoli_for_all && body.emetti_per_ruoli) {
        _body.emetti_per_ruoli = [ ...body.emetti_per_ruoli ];
      }
    } else {
      _body.emetti_per_tipi = [];
      _body.emetti_per_entita = [];
      _body.emetti_per_ruoli = [];
    }
    return _body;
  }

  _onSubmit(form: any) {
    this._updateServerSettings(form);
  }

  onAvatarError(event: any) {
    event.target.src = './assets/images/avatar.png'
  }
}
