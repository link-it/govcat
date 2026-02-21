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
import { Observable } from 'rxjs';

import { Tools } from '@linkit/components';

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

  constructor(
    private apiService: OpenAPIService
  ) {}

  /**
   * Mappa ruoli_referente al ruolo dashboard usato in stati_dashboard.
   * Priorità: referente_dominio > referente_servizio/referente_adesione > ruoli tecnici > richiedente
   */
  private _mapRuoliReferenteToDashboardRole(ruoliReferente: string[]): string | null {
    if (!ruoliReferente || ruoliReferente.length === 0) return null;

    // Priorità più alta: referente_dominio
    if (ruoliReferente.includes('referente_dominio')) {
      return 'referente_superiore';
    }
    // referente_tecnico_dominio (senza referente_dominio)
    if (ruoliReferente.includes('referente_tecnico_dominio')) {
      return 'referente_tecnico';
    }
    // Referente servizio o adesione
    if (ruoliReferente.includes('referente_servizio') || ruoliReferente.includes('referente_adesione')) {
      return 'referente';
    }
    // Ruoli tecnici di servizio o adesione
    if (ruoliReferente.includes('referente_tecnico_servizio') || ruoliReferente.includes('referente_tecnico_adesione')) {
      return 'referente_tecnico';
    }
    // Richiedente
    if (ruoliReferente.includes('richiedente_servizio') || ruoliReferente.includes('richiedente_adesione')) {
      return 'richiedente';
    }

    return null;
  }

  /**
   * Verifica se una sezione ha stati configurati in stati_dashboard per il ruolo specificato.
   */
  private _hasStatiDashboard(configSection: string, dashboardRole: string): boolean {
    const workflow = Tools.Configurazione?.[configSection]?.workflow;
    const statiDashboard = workflow?.stati_dashboard;
    if (!statiDashboard) return false;

    const statiPerRuolo = statiDashboard[dashboardRole];
    return Array.isArray(statiPerRuolo) && statiPerRuolo.length > 0;
  }

  computeRoleConfig(ruolo: string, ruoliReferente: string[]): DashboardRoleConfig {
    // Gestore: tutto visibile
    if (ruolo === 'gestore') {
      return { servizi: true, adesioni: true, client: true, comunicazioni: true, utenti: true };
    }

    // Coordinatore: tutto tranne client
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

    return {
      servizi: serviziVisible,
      adesioni: adesioniVisible,
      client: false,
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
}
