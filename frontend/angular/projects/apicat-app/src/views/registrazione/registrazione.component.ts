import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { TranslateService } from '@ngx-translate/core';

import { ConfigService, Tools } from '@linkit/components';
import { RegistrazioneService } from '@app/services/registrazione.service';
import { AuthenticationService } from '@app/services/authentication.service';
import {
  StatoRegistrazione,
  StatoRegistrazioneEnum
} from '@app/model/registrazione';

export type RegistrazioneStep = 'conferma' | 'modifica' | 'verifica' | 'completato';

@Component({
  selector: 'app-registrazione',
  templateUrl: './registrazione.component.html',
  styleUrls: ['./registrazione.component.scss'],
  standalone: false
})
export class RegistrazioneComponent implements OnInit, OnDestroy {

  currentStep: RegistrazioneStep = 'conferma';
  statoRegistrazione: StatoRegistrazione | null = null;
  loading: boolean = true;
  error: string | null = null;

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
          this.error = err.message || 'Errore nel caricamento dello stato';
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
      case StatoRegistrazioneEnum.Completata:
        this.currentStep = 'completato';
        break;
      default:
        this.currentStep = 'conferma';
    }
  }

  // Event handlers per i componenti figlio

  onConfermaEmail(): void {
    this.loading = true;
    this.error = null;

    const sub = this.registrazioneService.confermaEmail().subscribe({
      next: (response) => {
        // /conferma-email gia completa la registrazione e restituisce il profilo
        if (response.profilo) {
          this.authenticationService.setCurrentSession(response.profilo);
          this.authenticationService.reloadSession();
        }
        this.currentStep = 'completato';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
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
        this.error = err.message;
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
        this.error = err.message;
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
          this.completaRegistrazione();
        } else {
          this.error = response.messaggio || 'Codice non valido';
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = err.message;
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
        this.error = err.message;
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

  private completaRegistrazione(): void {
    const sub = this.registrazioneService.completaRegistrazione().subscribe({
      next: (response) => {
        // Aggiorna la sessione se il backend restituisce il profilo
        if (response.profilo) {
          this.authenticationService.setCurrentSession(response.profilo);
          this.authenticationService.reloadSession();
        }
        this.currentStep = 'completato';
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
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
