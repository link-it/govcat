import { Injectable, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, timer, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import { ApiClient } from './api.client';
import { HttpParams } from '@angular/common/http';
import {
  StatoRegistrazione,
  StatoRegistrazioneEnum,
  ModificaEmailRequest,
  VerificaCodiceRequest,
  RegistrazioneResponse,
  VerificaCodiceResponse,
  SelezionaOrganizzazioneRequest
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

  constructor(
    private http: ApiClient,
    private translate: TranslateService
  ) {}

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

  // ---------- Issue 229: scelta organizzazione (opzionale) ----------

  /**
   * GET /api/v1/registrazione/organizzazioni
   * Lista paginata delle organizzazioni selezionabili durante
   * la registrazione. Richiede JWT first-login. Supporta
   * `q` (full-text), `nome` (esatto), `page`, `size`, `sort`.
   */
  listOrganizzazioni(query: { q?: string; nome?: string; page?: number; size?: number; sort?: string } = {}): Observable<any> {
    let params = new HttpParams();
    if (query.q) { params = params.set('q', query.q); }
    if (query.nome) { params = params.set('nome', query.nome); }
    if (typeof query.page === 'number') { params = params.set('page', String(query.page)); }
    if (typeof query.size === 'number') { params = params.set('size', String(query.size)); }
    if (query.sort) { params = params.set('sort', query.sort); }
    return this.http.get<any>(`${this.BASE_PATH}/organizzazioni`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/registrazione/organizzazione
   * Salva la scelta dell'organizzazione richiesta per il
   * primo accesso. Body: `{ id_organizzazione }`. La scelta
   * non e` ancora vincolante: viene confermata da
   * `completaRegistrazione` e poi richiede approvazione admin.
   */
  selezionaOrganizzazione(idOrganizzazione: string): Observable<StatoRegistrazione> {
    const body: SelezionaOrganizzazioneRequest = { id_organizzazione: idOrganizzazione };
    return this.http.post<StatoRegistrazione>(`${this.BASE_PATH}/organizzazione`, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * DELETE /api/v1/registrazione/organizzazione
   * Rimuove la scelta dell'organizzazione (l'utente puo`
   * tornare a "saltare" lo step prima del completamento).
   */
  rimuoviOrganizzazione(): Observable<StatoRegistrazione> {
    return this.http.delete<StatoRegistrazione>(`${this.BASE_PATH}/organizzazione`).pipe(
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

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = this.translate.instant('APP.MESSAGE.ERROR.Default');

    if (error.error instanceof ErrorEvent) {
      // Errore client-side
      errorMessage = error.error.message;
    } else {
      // Errore server-side - prova a tradurre il codice di errore dal campo detail
      if (error.error?.detail) {
        const code = error.error.detail;
        // Prova a tradurre il codice (es: REG.400.NO.EMAIL.JWT -> APP.MESSAGE.ERROR.REG.400.NO.EMAIL.JWT)
        const translated = this.translate.instant(`APP.MESSAGE.ERROR.${code}`);
        // Se la traduzione esiste (non ritorna la chiave stessa), usala
        if (translated !== `APP.MESSAGE.ERROR.${code}`) {
          errorMessage = translated;
        } else {
          // Altrimenti usa il detail così com'è
          errorMessage = code;
        }
      } else {
        // Fallback per status code senza detail
        switch (error.status) {
          case 400:
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.GEN.400');
            break;
          case 409:
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.GEN.409');
            break;
          case 410:
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.REG.410.EXPIRED');
            break;
          case 429:
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.REG.429.MAX.SENDS');
            break;
          default:
            errorMessage = `${this.translate.instant('APP.MESSAGE.ERROR.Default')} (${error.status})`;
        }
      }
    }

    return throwError(() => ({ status: error.status, message: errorMessage, error: error.error }));
  }
}
