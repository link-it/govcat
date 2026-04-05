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
import { Injectable, Optional } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';
import { OAuthService } from 'angular-oauth2-oidc';

import { Tools } from '../services/tools.service';
import { PageloaderService } from '../services/pageloader.service';
import { ConfigService } from '../services/config.service';

export const DISABLE_GLOBAL_EXCEPTION_HANDLING = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  // Stato per gestire richieste concorrenti durante il refresh
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(
    private router: Router,
    private translate: TranslateService,
    private pageloaderService: PageloaderService,
    private configService: ConfigService,
    @Optional() private oauthService: OAuthService
  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.ignoreErrorHandling(request)) {
      return next.handle(request);
    }

    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401 && !this.shouldSkipAuthRefresh(request)) {
          return this.handle401Error(request, next, err);
        }

        // Gestione altri errori
        return this.handleOtherErrors(err);
      })
    );
  }

  /**
   * Gestisce l'errore 401 tentando il refresh del token se OAuth è configurato
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler, originalError: HttpErrorResponse): Observable<HttpEvent<any>> {
    // Verifica se OAuth è attivo e configurato
    if (!this.isOAuthEnabled()) {
      return this.redirectToLogin(originalError);
    }

    // Verifica se abbiamo un refresh token
    const hasRefreshToken = !!this.oauthService?.getRefreshToken();
    if (!hasRefreshToken) {
      return this.redirectToLogin(originalError);
    }

    if (!this.isRefreshing) {
      // Prima richiesta che fallisce con 401, inizia il refresh
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.refreshToken().pipe(
        switchMap((newToken: string) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(newToken);
          // Riprova la richiesta originale con il nuovo token
          return next.handle(this.addTokenToRequest(request, newToken));
        }),
        catchError((refreshError) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(null);
          // Refresh fallito, reindirizza al login
          return this.redirectToLogin(originalError);
        })
      );
    } else {
      // Refresh già in corso, attendi il completamento
      return this.refreshTokenSubject.pipe(
        filter((token): token is string => token !== null),
        take(1),
        switchMap((token) => {
          // Riprova la richiesta con il nuovo token
          return next.handle(this.addTokenToRequest(request, token));
        }),
        catchError(() => {
          // Se anche il retry fallisce, reindirizza al login
          return this.redirectToLogin(originalError);
        })
      );
    }
  }

  /**
   * Esegue il refresh del token tramite OAuthService
   */
  private refreshToken(): Observable<string> {
    return from(this.oauthService!.refreshToken()).pipe(
      switchMap(() => {
        const newToken = this.oauthService!.getAccessToken();
        if (newToken) {
          return [newToken];
        }
        return throwError(() => new Error('No token after refresh'));
      })
    );
  }

  /**
   * Aggiunge il token Authorization alla richiesta
   */
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Verifica se OAuth è abilitato e configurato
   */
  private isOAuthEnabled(): boolean {
    if (!this.oauthService) {
      return false;
    }

    const appConfig = this.configService.getConfiguration()?.AppConfig;
    if (!appConfig) {
      return false;
    }

    // OAuth non è attivo se BackdoorOAuth è true
    const backdoorOAuth = appConfig.AUTH_SETTINGS?.OAUTH?.BackdoorOAuth;
    if (backdoorOAuth) {
      return false;
    }

    // OAuth non è attivo se è accesso anonimo
    const anonymousAccess = appConfig.ANONYMOUS_ACCESS;
    if (anonymousAccess) {
      return false;
    }

    // Verifica che il refresh sia abilitato nella configurazione (default: true)
    const enableRefreshOn401 = appConfig.AUTH_SETTINGS?.OAUTH?.EnableRefreshOn401;
    if (enableRefreshOn401 === false) {
      return false;
    }

    return true;
  }

  /**
   * Verifica se la richiesta deve saltare il refresh (es. richieste al token endpoint)
   */
  private shouldSkipAuthRefresh(request: HttpRequest<any>): boolean {
    // Skip se esplicitamente richiesto nel context
    if (request.context.get(SKIP_AUTH_REFRESH)) {
      return true;
    }

    // Skip per richieste al token endpoint (evita loop infiniti)
    if (this.oauthService) {
      const tokenEndpoint = this.oauthService.tokenEndpoint;
      if (tokenEndpoint && request.url.includes(tokenEndpoint)) {
        return true;
      }
    }

    // Skip per URL noti che non richiedono autenticazione
    const skipUrls = [
      '/oauth/token',
      '/oauth2/token',
      '/.well-known/openid-configuration',
      '-config.json'
    ];

    return skipUrls.some(url => request.url.includes(url));
  }

  /**
   * Reindirizza al login dopo aver mostrato l'errore
   */
  private redirectToLogin(err: HttpErrorResponse): Observable<never> {
    Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));

    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 500);

    this.pageloaderService.hideLoader();
    const error = { message: err.message || err.statusText, error: err.error };
    return throwError(() => error);
  }

  /**
   * Gestisce gli errori diversi da 401
   */
  private handleOtherErrors(err: HttpErrorResponse): Observable<never> {
    if (err.status === 403) {
      Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));
    }

    this.pageloaderService.hideLoader();
    const error = { message: err.message || err.statusText, error: err.error };
    return throwError(() => error);
  }

  private ignoreErrorHandling(request: HttpRequest<any>): boolean {
    return request.context.get(DISABLE_GLOBAL_EXCEPTION_HANDLING);
  }
}
