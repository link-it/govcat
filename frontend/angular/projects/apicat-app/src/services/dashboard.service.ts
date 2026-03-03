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
import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, Subject, forkJoin, of, timer } from 'rxjs';
import { catchError, map, retry, share, switchMap, takeUntil } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';

import { AuthenticationService } from './authentication.service';
import { OpenAPIService } from './openAPI.service';
import {
  DashboardPagedResponse,
  DashboardItemServizio,
  DashboardItemAdesione,
  DashboardItemClient,
  DashboardItemComunicazione,
  DashboardItemUtente,
  DashboardRoleConfig,
  ProfiloRuoli
} from '../model/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private _dashboardCount$: Observable<number> | null = null;
  private readonly _stopPolling = new Subject<void>();

  constructor(
    private readonly apiService: OpenAPIService,
    private readonly authenticationService: AuthenticationService,
    private readonly configService: ConfigService
  ) {}

  /**
   * Mappa ruoli/pannelli per i ruoli referente.
   * L'utente può avere più ruoli e la visibilità è l'unione dei pannelli di ogni ruolo.
   *
   * Referente dominio: servizi, adesioni, comunicazioni
   * Referente dominio tecnico: comunicazioni
   * Referente servizio: servizi, adesioni, comunicazioni
   * Referente servizio tecnico: comunicazioni
   * Referente adesione: comunicazioni
   * Referente adesione tecnico: comunicazioni
   */
  private static readonly _REFERENTE_PANELS: { [ruolo: string]: (keyof DashboardRoleConfig)[] } = {
    referente_dominio: ['servizi', 'adesioni', 'comunicazioni'],
    referente_tecnico_dominio: ['comunicazioni'],
    referente_servizio: ['servizi', 'adesioni', 'comunicazioni'],
    referente_tecnico_servizio: ['comunicazioni'],
    referente_adesione: ['comunicazioni'],
    referente_tecnico_adesione: ['comunicazioni']
  };

  private _isHideComunicazioniGestore(): boolean {
    const appConfig = this.configService.getConfiguration();
    return appConfig?.AppConfig?.Layout?.dashboard?.hideNotificationGestore === true;
  }

  computeRoleConfig(ruolo: string, ruoliReferente: string[]): DashboardRoleConfig {
    // Gestore: tutto visibile (comunicazioni controllate da hideNotificationGestore)
    if (ruolo === 'gestore') {
      const hideCom = this._isHideComunicazioniGestore();
      return { servizi: true, adesioni: true, client: true, comunicazioni: !hideCom, utenti: true };
    }

    // Coordinatore: servizi, adesioni, comunicazioni, utenti
    if (ruolo === 'coordinatore') {
      return { servizi: true, adesioni: true, client: false, comunicazioni: true, utenti: true };
    }

    // Referente: unione dei pannelli per ogni ruolo referente
    const config: DashboardRoleConfig = {
      servizi: false,
      adesioni: false,
      client: false,
      comunicazioni: false,
      utenti: false
    };

    if (!ruoliReferente || ruoliReferente.length === 0) {
      config.comunicazioni = true;
      return config;
    }

    for (const ruoloRef of ruoliReferente) {
      const panels = DashboardService._REFERENTE_PANELS[ruoloRef];
      if (panels) {
        for (const panel of panels) {
          config[panel] = true;
        }
      }
    }

    // Fallback: se ha ruoli referente ma nessuno mappato, almeno comunicazioni
    if (!config.comunicazioni && !config.servizi && !config.adesioni) {
      config.comunicazioni = true;
    }

    return config;
  }

  getRuoliProfilo(): Observable<ProfiloRuoli> {
    return this.apiService.getList('profilo/ruoli');
  }

  private _dashboardOptions(): any {
    return { params: new HttpParams().set('dashboard', 'true') };
  }

  getServizi(): Observable<DashboardPagedResponse<DashboardItemServizio>> {
    return this.apiService.getList('servizi', this._dashboardOptions());
  }

  getAdesioni(): Observable<DashboardPagedResponse<DashboardItemAdesione>> {
    return this.apiService.getList('adesioni', this._dashboardOptions());
  }

  getClient(): Observable<DashboardPagedResponse<DashboardItemClient>> {
    return this.apiService.getList('client', this._dashboardOptions());
  }

  getComunicazioni(): Observable<DashboardPagedResponse<DashboardItemComunicazione>> {
    return this.apiService.getList('notifiche', this._dashboardOptions());
  }

  getUtenti(): Observable<DashboardPagedResponse<DashboardItemUtente>> {
    return this.apiService.getList('utenti', this._dashboardOptions());
  }

  getDashboardCount(timerMs: number): Observable<number> {
    if (!this._dashboardCount$) {
      this._dashboardCount$ = this._resolveRoleConfig().pipe(
        switchMap(roleConfig => {
          return timer(1, timerMs).pipe(
            switchMap(() => this._fetchTotalCount(roleConfig)),
            retry(3),
            catchError(() => of(0)),
            share(),
            takeUntil(this._stopPolling)
          );
        })
      );
    }
    return this._dashboardCount$;
  }

  stopDashboardPolling(): void {
    this._stopPolling.next();
    this._dashboardCount$ = null;
  }

  private _resolveRoleConfig(): Observable<DashboardRoleConfig> {
    const user: any = this.authenticationService.getUser();
    const ruolo = user?.ruolo || '';

    if (ruolo === 'gestore' || ruolo === 'coordinatore') {
      return of(this.computeRoleConfig(ruolo, []));
    }

    return this.getRuoliProfilo().pipe(
      map(profilo => this.computeRoleConfig(profilo.ruolo, profilo.ruoli_referente || [])),
      catchError(() => of(this.computeRoleConfig(ruolo, [])))
    );
  }

  private _fetchTotalCount(roleConfig: DashboardRoleConfig): Observable<number> {
    const countOptions: any = {
      params: new HttpParams().set('dashboard', 'true').set('size', '0')
    };

    const calls: Observable<number>[] = [];

    if (roleConfig.servizi) {
      calls.push(this.apiService.getList('servizi', countOptions).pipe(
        map((r: any) => r?.page?.totalElements || 0), catchError(() => of(0))
      ));
    }
    if (roleConfig.adesioni) {
      calls.push(this.apiService.getList('adesioni', countOptions).pipe(
        map((r: any) => r?.page?.totalElements || 0), catchError(() => of(0))
      ));
    }
    if (roleConfig.client) {
      calls.push(this.apiService.getList('client', countOptions).pipe(
        map((r: any) => r?.page?.totalElements || 0), catchError(() => of(0))
      ));
    }
    if (roleConfig.comunicazioni) {
      calls.push(this.apiService.getList('notifiche', countOptions).pipe(
        map((r: any) => r?.page?.totalElements || 0), catchError(() => of(0))
      ));
    }
    if (roleConfig.utenti) {
      calls.push(this.apiService.getList('utenti', countOptions).pipe(
        map((r: any) => r?.page?.totalElements || 0), catchError(() => of(0))
      ));
    }

    if (calls.length === 0) {
      return of(0);
    }

    return forkJoin(calls).pipe(
      map(counts => counts.reduce((sum, c) => sum + c, 0))
    );
  }
}
