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
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@linkit/components';

import { AuthenticationService } from '../../services/authentication.service';
import { DashboardService } from '../../services/dashboard.service';
import { DashboardRoleConfig } from '../../model/dashboard';

import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  static readonly Name = 'DashboardComponent';

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Dashboard', url: '', type: 'title', iconBs: 'speedometer2' }
  ];

  roleConfig: DashboardRoleConfig = {
    servizi: false,
    adesioni: false,
    client: false,
    comunicazioni: false,
    utenti: false
  };

  serviziItems: any[] = [];
  adesioniItems: any[] = [];
  clientItems: any[] = [];
  comunicazioniItems: any[] = [];
  utentiItems: any[] = [];

  serviziTotal: number = 0;
  adesioniTotal: number = 0;
  clientTotal: number = 0;
  comunicazioniTotal: number = 0;
  utentiTotal: number = 0;

  loadingServizi: boolean = false;
  loadingAdesioni: boolean = false;
  loadingClient: boolean = false;
  loadingComunicazioni: boolean = false;
  loadingUtenti: boolean = false;

  isRefreshing: boolean = false;

  showSummaryCards: boolean = true;
  sectionsConfig: any = {};
  hideVersions: boolean = false;

  serviziStatusConfig: any = {};
  adesioniStatusConfig: any = {};
  clientStatusConfig: any = {};
  utentiStatusConfig: any = {};

  constructor(
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    private authenticationService: AuthenticationService,
    private dashboardService: DashboardService
  ) {}

  ngOnInit() {
    this._initRoleConfig();
    this._loadConfigs();
    this._loadData();
  }

  private _loadConfigs() {
    const appConfig = this.configService.getConfiguration();
    this.hideVersions = appConfig?.AppConfig?.Services?.hideVersions || false;

    this.configService.getConfig('dashboard').subscribe((config: any) => {
      this.showSummaryCards = config?.showSummaryCards !== false;
      this.sectionsConfig = config?.sections || {};
    });
    this.configService.getConfig('servizi').subscribe((config: any) => {
      this.serviziStatusConfig = config?.options?.status?.values || {};
    });
    this.configService.getConfig('adesioni').subscribe((config: any) => {
      this.adesioniStatusConfig = config?.options?.status?.values || {};
    });
    this.configService.getConfig('client').subscribe((config: any) => {
      const status = config?.options?.status?.values || {};
      const ambient = config?.options?.ambient?.values || {};
      this.clientStatusConfig = { ...status, ...ambient };
    });
    this.configService.getConfig('utenti').subscribe((config: any) => {
      this.utentiStatusConfig = config?.options?.status?.values || {};
    });
  }

  getSummaryStyle(section: string): { [key: string]: string } {
    const cfg = this.sectionsConfig[section]?.summary;
    if (cfg) {
      return {
        'background': `linear-gradient(135deg, ${cfg.gradientFrom}, ${cfg.gradientTo})`,
        'color': cfg.textColor
      };
    }
    return {};
  }

  getSectionIcon(section: string): string {
    return this.sectionsConfig[section]?.icon || '';
  }

  getSectionBorderColor(section: string): string {
    return this.sectionsConfig[section]?.borderColor || '#0d6efd';
  }

  private _initRoleConfig() {
    const user: any = this.authenticationService.getUser();
    const ruolo = user?.ruolo || '';
    this.roleConfig = this.dashboardService.getRoleConfig(ruolo);
  }

  private _loadData() {
    if (this.roleConfig.servizi) {
      this.loadingServizi = true;
      this.dashboardService.getServizi().subscribe({
        next: (response) => {
          this.serviziItems = response.content || [];
          this.serviziTotal = response.page?.totalElements || 0;
          this.loadingServizi = false;
        },
        error: () => { this.loadingServizi = false; }
      });
    }

    if (this.roleConfig.adesioni) {
      this.loadingAdesioni = true;
      this.dashboardService.getAdesioni().subscribe({
        next: (response) => {
          this.adesioniItems = response.content || [];
          this.adesioniTotal = response.page?.totalElements || 0;
          this.loadingAdesioni = false;
        },
        error: () => { this.loadingAdesioni = false; }
      });
    }

    if (this.roleConfig.client) {
      this.loadingClient = true;
      this.dashboardService.getClient().subscribe({
        next: (response) => {
          this.clientItems = response.content || [];
          this.clientTotal = response.page?.totalElements || 0;
          this.loadingClient = false;
        },
        error: () => { this.loadingClient = false; }
      });
    }

    if (this.roleConfig.comunicazioni) {
      this.loadingComunicazioni = true;
      this.dashboardService.getComunicazioni().subscribe({
        next: (response) => {
          this.comunicazioniItems = response.content || [];
          this.comunicazioniTotal = response.page?.totalElements || 0;
          this.loadingComunicazioni = false;
        },
        error: () => { this.loadingComunicazioni = false; }
      });
    }

    if (this.roleConfig.utenti) {
      this.loadingUtenti = true;
      this.dashboardService.getUtenti().subscribe({
        next: (response) => {
          this.utentiItems = response.content || [];
          this.utentiTotal = response.page?.totalElements || 0;
          this.loadingUtenti = false;
        },
        error: () => { this.loadingUtenti = false; }
      });
    }
  }

  onViewAll(panelType: string) {
    switch (panelType) {
      case 'servizi':
        this.router.navigate(['/servizi']);
        break;
      case 'adesioni':
        this.router.navigate(['/adesioni']);
        break;
      case 'client':
        this.router.navigate(['/client']);
        break;
      case 'comunicazioni':
        this.router.navigate(['/notifications']);
        break;
      case 'utenti':
        this.router.navigate(['/utenti']);
        break;
    }
  }

  onViewItem(item: any, panelType: string) {
    switch (panelType) {
      case 'servizi':
        if (item.id_servizio) {
          this.router.navigate(['/servizi', item.id_servizio]);
        }
        break;
      case 'adesioni':
        if (item.id_adesione) {
          this.router.navigate(['/adesioni', item.id_adesione]);
        }
        break;
      case 'client':
        if (item.id_client) {
          this.router.navigate(['/client', item.id_client]);
        }
        break;
      case 'comunicazioni':
        this.router.navigate(['/notifications']);
        break;
      case 'utenti':
        if (item.id_utente) {
          this.router.navigate(['/utenti', item.id_utente]);
        }
        break;
    }
  }

  onRefresh() {
    this.isRefreshing = true;
    this._loadData();
    setTimeout(() => { this.isRefreshing = false; }, 600);
  }
}
