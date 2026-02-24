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

import { Tools } from '@linkit/components';

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
  private _stopPolling = new Subject<void>();

  constructor(
    private apiService: OpenAPIService,
    private authenticationService: AuthenticationService
  ) {}

  /**
   * Mappa ruoli_referente al ruolo dashboard (ConfigurazioneRuolo enum).
   * Valori possibili: richiedente, referente, referente_superiore, gestore
   * Priorità: referente_dominio > referente_servizio/adesione/tecnici > richiedente
   */
  private _mapRuoliReferenteToDashboardRole(ruoliReferente: string[]): string | null {
    if (!ruoliReferente || ruoliReferente.length === 0) return null;

    // referente_dominio o referente_tecnico_dominio → referente_superiore
    if (ruoliReferente.includes('referente_dominio') || ruoliReferente.includes('referente_tecnico_dominio')) {
      return 'referente_superiore';
    }
    // Referente o referente tecnico di servizio/adesione → referente
    if (ruoliReferente.includes('referente_servizio') || ruoliReferente.includes('referente_adesione') ||
        ruoliReferente.includes('referente_tecnico_servizio') || ruoliReferente.includes('referente_tecnico_adesione')) {
      return 'referente';
    }
    // Richiedente
    if (ruoliReferente.includes('richiedente_servizio') || ruoliReferente.includes('richiedente_adesione')) {
      return 'richiedente';
    }

    return null;
  }

  /**
   * Verifica se una sezione ha stati configurati in stati_dashboard per il ruolo specificato.
   * stati_dashboard è un array di { ruolo: string, stati: string[] }
   */
  private _hasStatiDashboard(configSection: string, dashboardRole: string): boolean {
    const workflow = Tools.Configurazione?.[configSection]?.workflow;
    const statiDashboard = workflow?.stati_dashboard;
    if (!Array.isArray(statiDashboard)) return false;

    const entry = statiDashboard.find((s: any) => s.ruolo === dashboardRole);
    return Array.isArray(entry?.stati) && entry.stati.length > 0;
  }

  private _hasStatiDashboardClient(): boolean {
    const stati = Tools.Configurazione?.adesione?.stati_dashboard_client;
    return Array.isArray(stati) && stati.length > 0;
  }

  computeRoleConfig(ruolo: string, ruoliReferente: string[]): DashboardRoleConfig {
    // Gestore: tutto visibile
    if (ruolo === 'gestore') {
      return { servizi: true, adesioni: true, client: true, comunicazioni: true, utenti: true };
    }

    // Coordinatore: tutto tranne client e utenti
    if (ruolo === 'coordinatore') {
      return { servizi: true, adesioni: true, client: false, comunicazioni: true, utenti: true };
    }

    // Referente: dipende da ruoliReferente e configurazione stati_dashboard
    const dashboardRole = this._mapRuoliReferenteToDashboardRole(ruoliReferente);

    if (!dashboardRole) {
      // Nessun ruolo referente mappabile: solo comunicazioni
      return { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false };
    }

    const serviziVisible = this._hasStatiDashboard('servizio', dashboardRole);
    const adesioniVisible = this._hasStatiDashboard('adesione', dashboardRole);
    // Client visibile solo per referente_superiore (dominio) se stati_dashboard_client è configurato
    const clientVisible = dashboardRole === 'referente_superiore' && this._hasStatiDashboardClient();

    return {
      servizi: serviziVisible,
      adesioni: adesioniVisible,
      client: clientVisible,
      comunicazioni: true,
      utenti: false
    };
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
