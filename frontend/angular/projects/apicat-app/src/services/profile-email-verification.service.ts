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
import { Injectable, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription, timer, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import { ApiClient } from './api.client';
import {
  InviaCodiceEmailProfiloRequest,
  InviaCodiceEmailProfiloResponse,
  VerificaCodiceEmailProfiloRequest,
  VerificaCodiceEmailProfiloResponse
} from '../model/profile-email-verification';

@Injectable({
  providedIn: 'root'
})
export class ProfileEmailVerificationService implements OnDestroy {

  private readonly BASE_PATH = '/profilo/email';

  // Countdown OTP
  private countdownSubject = new BehaviorSubject<number>(0);
  public countdown$ = this.countdownSubject.asObservable();
  private countdownSubscription?: Subscription;
  private scadenzaDefault = 300; // 5 minuti in secondi

  // Tentativi rimanenti
  private tentativiRimanentiSubject = new BehaviorSubject<number | null>(null);
  public tentativiRimanenti$ = this.tentativiRimanentiSubject.asObservable();

  constructor(
    private http: ApiClient,
    private translate: TranslateService
  ) {}

  ngOnDestroy(): void {
    this.stopCountdown();
  }

  /**
   * POST /api/v1/profilo/email/invia-codice
   * Invia il codice OTP alla nuova email
   * @param fieldName Nome del campo: 'email' o 'email_aziendale'
   * @param nuovaEmail Nuova email da verificare
   */
  inviaCodice(fieldName: 'email' | 'email_aziendale', nuovaEmail: string): Observable<InviaCodiceEmailProfiloResponse> {
    const body: Record<string, string> = { [fieldName]: nuovaEmail };
    return this.http.post<InviaCodiceEmailProfiloResponse>(`${this.BASE_PATH}/invia-codice`, body).pipe(
      tap(response => {
        const scadenza = response.scadenza_secondi || this.scadenzaDefault;
        this.startCountdown(scadenza);
        this.tentativiRimanentiSubject.next(null);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * POST /api/v1/profilo/email/verifica-codice
   * Verifica il codice OTP inserito
   */
  verificaCodice(codice: string): Observable<VerificaCodiceEmailProfiloResponse> {
    const body: VerificaCodiceEmailProfiloRequest = { codice };
    return this.http.post<VerificaCodiceEmailProfiloResponse>(`${this.BASE_PATH}/verifica-codice`, body).pipe(
      tap(response => {
        if (response.esito) {
          this.stopCountdown();
          this.tentativiRimanentiSubject.next(null);
        } else {
          if (response.tentativi_rimanenti !== undefined) {
            this.tentativiRimanentiSubject.next(response.tentativi_rimanenti);
          }
        }
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

  resetState(): void {
    this.stopCountdown();
    this.tentativiRimanentiSubject.next(null);
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
        // Prova a tradurre il codice (es: PRF.400.NOT.ENABLED -> APP.MESSAGE.ERROR.PRF.400.NOT.ENABLED)
        const translated = this.translate.instant(`APP.MESSAGE.ERROR.${code}`);
        // Se la traduzione esiste (non ritorna la chiave stessa), usala
        if (translated !== `APP.MESSAGE.ERROR.${code}`) {
          errorMessage = translated;
        } else {
          // Altrimenti usa il detail cosi com'e'
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
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.PRF.410.EXPIRED');
            break;
          case 429:
            errorMessage = this.translate.instant('APP.MESSAGE.ERROR.PRF.429.MAX.SENDS');
            break;
          default:
            errorMessage = `${this.translate.instant('APP.MESSAGE.ERROR.Default')} (${error.status})`;
        }
      }
    }

    return throwError(() => ({ status: error.status, message: errorMessage, error: error.error }));
  }
}
