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
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { OpenAPIService } from './openAPI.service';
import {
  DashboardPagedResponse,
  DashboardItemServizio,
  DashboardItemAdesione,
  DashboardItemClient,
  DashboardItemComunicazione,
  DashboardItemUtente,
  DashboardRoleConfig
} from '../model/dashboard';

@Injectable({ providedIn: 'root' })
export class DashboardService {

  private useMock: boolean = true;
  private mockBasePath: string = './assets/mock/dashboard';

  static readonly ROLE_CONFIG: { [role: string]: DashboardRoleConfig } = {
    'gestore': { servizi: true, adesioni: true, client: true, comunicazioni: true, utenti: true },
    'coordinatore': { servizi: true, adesioni: true, client: false, comunicazioni: true, utenti: true },
    'referente_dominio': { servizi: true, adesioni: true, client: false, comunicazioni: true, utenti: false },
    'referente_dominio_tecnico': { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false },
    'referente_servizio': { servizi: true, adesioni: true, client: false, comunicazioni: true, utenti: false },
    'referente_servizio_tecnico': { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false },
    'referente_adesione': { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false },
    'referente_adesione_tecnico': { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false }
  };

  constructor(
    private http: HttpClient,
    private apiService: OpenAPIService
  ) {}

  getRoleConfig(ruolo: string): DashboardRoleConfig {
    return DashboardService.ROLE_CONFIG[ruolo] || { servizi: false, adesioni: false, client: false, comunicazioni: true, utenti: false };
  }

  getServizi(): Observable<DashboardPagedResponse<DashboardItemServizio>> {
    if (this.useMock) {
      return this.http.get<DashboardPagedResponse<DashboardItemServizio>>(`${this.mockBasePath}/servizi.json`);
    }
    return this.apiService.getList('dashboard/servizi');
  }

  getAdesioni(): Observable<DashboardPagedResponse<DashboardItemAdesione>> {
    if (this.useMock) {
      return this.http.get<DashboardPagedResponse<DashboardItemAdesione>>(`${this.mockBasePath}/adesioni.json`);
    }
    return this.apiService.getList('dashboard/adesioni');
  }

  getClient(): Observable<DashboardPagedResponse<DashboardItemClient>> {
    if (this.useMock) {
      return this.http.get<DashboardPagedResponse<DashboardItemClient>>(`${this.mockBasePath}/client.json`);
    }
    return this.apiService.getList('dashboard/client');
  }

  getComunicazioni(): Observable<DashboardPagedResponse<DashboardItemComunicazione>> {
    if (this.useMock) {
      return this.http.get<DashboardPagedResponse<DashboardItemComunicazione>>(`${this.mockBasePath}/comunicazioni.json`);
    }
    return this.apiService.getList('dashboard/comunicazioni');
  }

  getUtenti(): Observable<DashboardPagedResponse<DashboardItemUtente>> {
    if (this.useMock) {
      return this.http.get<DashboardPagedResponse<DashboardItemUtente>>(`${this.mockBasePath}/utenti.json`);
    }
    return this.apiService.getList('dashboard/utenti');
  }
}
