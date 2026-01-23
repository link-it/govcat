import { Injectable, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, timer, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { ApiClient } from './api.client';
import {
  StatoRegistrazione,
  StatoRegistrazioneEnum,
  ModificaEmailRequest,
  VerificaCodiceRequest,
  RegistrazioneResponse,
  VerificaCodiceResponse
} from '../model/registrazione';

@Injectable({
  providedIn: 'root'
})
export class RegistrazioneService implements OnDestroy {

  private readonly BASE_PATH = '/registrazione';

  // Countdown OTP
  private countdownSubject = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSubject.asObservable();
  private countdownSubscription?: Subscription;
  private scadenzaDefault = 300; // 5 minuti in secondi

  constructor(private http: ApiClient) {}

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /**
   * GET /api/v1/registrazione/stato
   * Recupera lo stato corrente della registrazione
   */
  getStato(): Observable<StatoRegistrazione> {
    return this.http.get<StatoRegistrazione>(`${this.BASE_PATH}/stato`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/conferma-email
   * Conferma l'email JWT senza modifiche
   */
  confermaEmail(): Observable<RegistrazioneResponse> {
    return this.http.post<RegistrazioneResponse>(`${this.BASE_PATH}/conferma-email`, {}).pipe(
      tap(response => {
        if (response.scadenza_secondi) {
          this.startCountdown(response.scadenza_secondi);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/modifica-email
   * Modifica l'email e invia codice OTP alla nuova email
   */
  modificaEmail(email: string): Observable<RegistrazioneResponse> {
    const body: ModificaEmailRequest = { email };
    return this.http.post<RegistrazioneResponse>(`${this.BASE_PATH}/modifica-email`, body).pipe(
      tap(response => {
        // Avvia countdown con valore dal backend o default
        const scadenza = response.scadenza_secondi || this.scadenzaDefault;
        this.startCountdown(scadenza);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/invia-codice
   * Reinvia il codice OTP
   */
  inviaCodice(): Observable<RegistrazioneResponse> {
    return this.http.post<RegistrazioneResponse>(`${this.BASE_PATH}/invia-codice`, {}).pipe(
      tap(response => {
        // Avvia countdown con valore dal backend o default
        const scadenza = response.scadenza_secondi || this.scadenzaDefault;
        this.startCountdown(scadenza);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/verifica-codice
   * Verifica il codice OTP inserito
   */
  verificaCodice(codice: string): Observable<VerificaCodiceResponse> {
    const body: VerificaCodiceRequest = { codice };
    return this.http.post<VerificaCodiceResponse>(`${this.BASE_PATH}/verifica-codice`, body).pipe(
      tap(response => {
        if (response.esito) {
          this.stopCountdown();
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/completa
   * Completa la registrazione
   */
  completaRegistrazione(): Observable<RegistrazioneResponse> {
    return this.http.post<RegistrazioneResponse>(`${this.BASE_PATH}/completa`, {}).pipe(
      tap(() => {
        this.stopCountdown();
      }),
      catchError(this.handleError)
    );
  }

  // Gestione countdown OTP

  startCountdown(secondi: number): void {
    this.stopCountdown();
    this.countdownSubject.next(secondi);

    this.countdownSubscription = timer(0, 1000).pipe(
      map(n => secondi - n)
    ).subscribe(remaining => {
      if (remaining >= 0) {
        this.countdownSubject.next(remaining);
      } else {
        this.stopCountdown();
      }
    });
  }

  stopCountdown(): void {
    if (this.countdownSubscription) {
      this.countdownSubscription.unsubscribe();
      this.countdownSubscription = undefined;
    }
    this.countdownSubject.next(0);
  }

  getCountdownValue(): number {
    return this.countdownSubject.value;
  }

  isCountdownActive(): boolean {
    return this.countdownSubject.value > 0;
  }

  formatCountdown(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Error handling

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Errore sconosciuto';

    if (error.error instanceof ErrorEvent) {
      // Errore client-side
      errorMessage = error.error.message;
    } else {
      // Errore server-side
      switch (error.status) {
        case 400:
          errorMessage = error.error?.detail || 'Richiesta non valida';
          break;
        case 409:
          errorMessage = error.error?.detail || 'Conflitto: email già in uso';
          break;
        case 410:
          errorMessage = 'Codice scaduto. Richiedi un nuovo codice.';
          break;
        case 429:
          errorMessage = 'Troppi tentativi. Riprova più tardi.';
          break;
        default:
          errorMessage = error.error?.detail || `Errore ${error.status}: ${error.message}`;
      }
    }

    return throwError(() => ({ status: error.status, message: errorMessage, error: error.error }));
  }
}
