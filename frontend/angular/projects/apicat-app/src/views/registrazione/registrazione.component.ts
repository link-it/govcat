import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { ConfigService, Tools } from '@linkit/components';
import { RegistrazioneService } from '@app/services/registrazione.service';
import { AuthenticationService } from '@app/services/authentication.service';
import {
  StatoRegistrazione,
  StatoRegistrazioneEnum
} from '@app/model/registrazione';

import { StepConfermaEmailComponent } from './components/step-conferma-email/step-conferma-email.component';
import { StepModificaEmailComponent } from './components/step-modifica-email/step-modifica-email.component';
import { StepVerificaCodiceComponent } from './components/step-verifica-codice/step-verifica-codice.component';
import { StepCompletatoComponent } from './components/step-completato/step-completato.component';
import { StepSelezionaOrganizzazioneComponent } from './components/step-seleziona-organizzazione/step-seleziona-organizzazione.component';

import { ItemOrganizzazione } from '@app/model/itemOrganizzazione';

/**
 * Issue 229 — aggiunto step opzionale `seleziona-organizzazione`
 * dopo la verifica OTP e prima del completamento. L'utente puo`
 * scegliere un'organizzazione esistente (che sara` approvata da
 * un AMM_ORG/gestore) o saltare lo step.
 */
export type RegistrazioneStep = 'conferma' | 'modifica' | 'verifica' | 'seleziona-organizzazione' | 'completato';

@Component({
  selector: 'app-registrazione',
  templateUrl: './registrazione.component.html',
  styleUrls: ['./registrazione.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    StepConfermaEmailComponent,
    StepModificaEmailComponent,
    StepVerificaCodiceComponent,
    StepCompletatoComponent,
    StepSelezionaOrganizzazioneComponent
  ]
})
export class RegistrazioneComponent implements OnInit, OnDestroy {

  currentStep: RegistrazioneStep = 'conferma';
  statoRegistrazione: StatoRegistrazione | null = null;
  loading: boolean = true;
  error: string | null = null;

  /**
   * Issue 229 — organizzazione che l'utente ha richiesto come
   * associazione durante il wizard di registrazione. Popolata da
   * `GET /registrazione/stato.organizzazione_richiesta` quando
   * la scelta e` stata gia` salvata (caso rientro nel wizard).
   * Passata al `step-completato` per mostrare il messaggio
   * "in attesa di approvazione".
   */
  organizzazioneRichiesta: ItemOrganizzazione | null = null;

  /**
   * Issue 229 — l'endpoint di finalizzazione cambia in base al
   * path con cui l'utente arriva allo step org:
   * - path "Conferma email" (no modifica): chiamiamo
   *   `/registrazione/conferma-email` che completa direttamente
   *   la registrazione lato BE leggendo l'eventuale
   *   `organizzazione_richiesta` salvata.
   * - path OTP (modifica email + verifica codice): la
   *   registrazione e` gia` in stato `EmailVerificata`, serve
   *   `/registrazione/completa`.
   *
   * Default `false` (path diretto). Settato a `true` da
   * `onVerificaCodice` e da `determineStep(EmailVerificata)`.
   */
  private useCompletaEndpoint = false;

  // Dati dal JWT
  emailJwt: string = '';
  emailProposta: string = '';
  nome: string = '';
  cognome: string = '';
  codiceFiscale: string = '';

  // Configurazione UI
  config: any;
  _title: string = '';
  _logo: string = '';

  private subscriptions: Subscription[] = [];

  constructor(
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private registrazioneService: RegistrazioneService,
    private authenticationService: AuthenticationService
  ) {
    this.config = this.configService.getConfiguration();
    this._title = this.config.AppConfig?.Layout?.Login?.title || '';
    this._logo = './assets/images/' + (this.config.AppConfig?.Layout?.Login?.logo || 'logo.png');
  }

  ngOnInit(): void {
    // Clear eventuali snackbar di errore obsolete (es. errori di autenticazione)
    Tools.MultiSnackbarDestroyAll();

    // Carica i dati iniziali dalla sessione (idm) se disponibili
    this.loadIdmFromSession();
    // Poi carica lo stato dettagliato dal backend
    this.loadStato();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.registrazioneService.stopCountdown();
  }

  /**
   * Carica i dati IDM dalla sessione corrente.
   * Questi dati provengono dalla risposta /profilo con stato "registrazione_richiesta"
   */
  private loadIdmFromSession(): void {
    const session = this.authenticationService.getCurrentSession();
    if (session?.idm) {
      this.nome = session.idm.nome || '';
      this.cognome = session.idm.cognome || '';
      this.emailJwt = session.idm.email || '';
      this.emailProposta = this.emailJwt;
      this.codiceFiscale = session.idm.principal || '';
    }
  }

  loadStato(): void {
    this.loading = true;
    this.error = null;

    const sub = this.registrazioneService.getStato().subscribe({
      next: (stato: StatoRegistrazione) => {
        this.statoRegistrazione = stato;
        // Aggiorna i dati solo se presenti nella risposta (potrebbero sovrascrivere quelli da idm)
        if (stato.email_jwt) {
          this.emailJwt = stato.email_jwt;
        }
        if (stato.email_proposta) {
          this.emailProposta = stato.email_proposta;
        } else if (!this.emailProposta) {
          this.emailProposta = this.emailJwt;
        }
        if (stato.nome) {
          this.nome = stato.nome;
        }
        if (stato.cognome) {
          this.cognome = stato.cognome;
        }
        if (stato.codice_fiscale) {
          this.codiceFiscale = stato.codice_fiscale;
        }
        // Issue 229 — preserva la scelta org gia` fatta dall'utente
        this.organizzazioneRichiesta = stato.organizzazione_richiesta ?? null;

        // Determina lo step in base allo stato
        this.determineStep(stato.stato);
        this.loading = false;
      },
      error: (err: any) => {
        // Se l'endpoint /registrazione/stato fallisce, usa i dati dalla sessione
        if (this.nome || this.emailJwt) {
          this.currentStep = 'conferma';
          this.loading = false;
        } else {
          this.error = Tools.GetErrorMsg(err);
          this.loading = false;
        }
      }
    });
    this.subscriptions.push(sub);
  }

  private determineStep(stato: StatoRegistrazioneEnum): void {
    switch (stato) {
      case StatoRegistrazioneEnum.InAttesaConferma:
        this.currentStep = 'conferma';
        break;
      case StatoRegistrazioneEnum.CodiceInviato:
        this.currentStep = 'verifica';
        break;
      case StatoRegistrazioneEnum.EmailVerificata:
        // Issue 229 — la registrazione e` stata verificata via OTP
        // ma non ancora completata: l'utente puo` (opzionalmente)
        // scegliere un'organizzazione prima del completamento.
        // In questo stato dobbiamo finalizzare con `/completa`.
        this.useCompletaEndpoint = true;
        this.currentStep = 'seleziona-organizzazione';
        break;
      case StatoRegistrazioneEnum.Completata:
        this.currentStep = 'completato';
        break;
      default:
        this.currentStep = 'conferma';
    }
  }

  // Event handlers per i componenti figlio

  onConfermaEmail(): void {
    // Issue 229 — l'utente conferma l'email JWT senza
    // modifiche. NON chiamiamo subito `/conferma-email` (che
    // completerebbe la registrazione e impedirebbe la scelta
    // dell'organizzazione): inseriamo prima lo step opzionale
    // di selezione organizzazione. La finalizzazione avviene
    // da `onSkipOrganizzazione` / `onConfermaOrganizzazione`
    // tramite `/conferma-email` (il BE legge l'eventuale
    // `organizzazione_richiesta` salvata dal POST `/organizzazione`).
    this.useCompletaEndpoint = false;
    this.error = null;
    this.currentStep = 'seleziona-organizzazione';
  }

  onModificaEmail(): void {
    this.currentStep = 'modifica';
  }

  onInviaModificaEmail(email: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.registrazioneService.modificaEmail(email).subscribe({
      next: (response) => {
        this.emailProposta = email;
        // Dopo aver registrato la nuova email, invia il codice OTP
        this.inviaCodiceDopo();
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  private inviaCodiceDopo(): void {
    const sub = this.registrazioneService.inviaCodice().subscribe({
      next: (response) => {
        this.currentStep = 'verifica';
        this.loading = false;
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onTornaAConferma(): void {
    this.currentStep = 'conferma';
    this.error = null;
  }

  onVerificaCodice(codice: string): void {
    this.loading = true;
    this.error = null;

    const sub = this.registrazioneService.verificaCodice(codice).subscribe({
      next: (response) => {
        if (response.esito) {
          // Issue 229 — OTP confermato: passiamo allo step
          // opzionale "Seleziona organizzazione" (l'utente puo`
          // saltarlo). `completaRegistrazione` sara` chiamata
          // dallo step (skip o confirm) tramite `/completa`
          // (path OTP).
          this.useCompletaEndpoint = true;
          this.currentStep = 'seleziona-organizzazione';
          this.loading = false;
        } else {
          this.error = response.messaggio || 'Codice non valido';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  // --- Issue 229: handlers step seleziona organizzazione ---

  onSkipOrganizzazione(): void {
    // Salta lo step: nessun POST, finalizziamo direttamente
    // con l'endpoint giusto per il path corrente.
    this.finalizzaRegistrazione();
  }

  onConfermaOrganizzazione(idOrganizzazione: string): void {
    this.loading = true;
    this.error = null;
    const sub = this.registrazioneService.selezionaOrganizzazione(idOrganizzazione).subscribe({
      next: (stato) => {
        // Aggiorniamo la scelta locale (il BE ce la rimanda nel
        // payload `StatoRegistrazione`), poi finalizziamo la
        // registrazione tramite l'endpoint corretto per il path.
        this.statoRegistrazione = stato;
        this.organizzazioneRichiesta = stato?.organizzazione_richiesta ?? null;
        this.finalizzaRegistrazione();
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onRimuoviOrganizzazione(): void {
    this.loading = true;
    this.error = null;
    const sub = this.registrazioneService.rimuoviOrganizzazione().subscribe({
      next: (stato) => {
        this.statoRegistrazione = stato;
        this.organizzazioneRichiesta = stato?.organizzazione_richiesta ?? null;
        this.loading = false;
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onReinviaCodice(): void {
    this.loading = true;
    this.error = null;

    const sub = this.registrazioneService.inviaCodice().subscribe({
      next: (response) => {
        this.loading = false;
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onCambiaEmail(): void {
    this.registrazioneService.stopCountdown();
    this.currentStep = 'modifica';
    this.error = null;
  }

  /**
   * Issue 229 — finalizza la registrazione scegliendo
   * l'endpoint corretto in base al path seguito:
   * - path diretto (no modifica email): `/conferma-email`
   * - path OTP (verifica codice): `/completa`
   * In entrambi i casi il BE legge l'`organizzazione_richiesta`
   * salvata dal POST `/organizzazione`.
   */
  private finalizzaRegistrazione(): void {
    this.loading = true;
    const obs = this.useCompletaEndpoint
      ? this.registrazioneService.completaRegistrazione()
      : this.registrazioneService.confermaEmail();

    const sub = obs.subscribe({
      next: (response) => {
        if (response.profilo) {
          this.authenticationService.setCurrentSession(response.profilo);
          this.authenticationService.reloadSession();
        }
        this.currentStep = 'completato';
        this.loading = false;
      },
      error: (err) => {
        this.error = Tools.GetErrorMsg(err);
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

  onVaiAlCatalogo(): void {
    this.router.navigate(['/servizi']);
  }

  closeAlert(): void {
    this.error = null;
  }
}
