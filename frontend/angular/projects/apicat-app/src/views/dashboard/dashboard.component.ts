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
import { HttpParams } from '@angular/common/http';

import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from '@linkit/components';

import { AuthenticationService } from '../../services/authentication.service';
import { DashboardService } from '../../services/dashboard.service';
import { OpenAPIService } from '../../services/openAPI.service';
import { UtilService } from '../../services/utils.service';
import { DashboardRoleConfig } from '../../model/dashboard';

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
  comunicazioniStatusConfig: any = {};
  utentiStatusConfig: any = {};

  // Expanded view state
  expandedSection: string | null = null;
  expandedItems: any[] = [];
  expandedTotal: number = 0;
  expandedLoading: boolean = false;
  expandedFilterData: any = null;
  _expandedLinks: any = null;
  _expandedPreventMultiCall: boolean = false;

  // Section title map
  private readonly _sectionTitles: { [key: string]: string } = {
    servizi: 'APP.DASHBOARD_PENDING.Servizi',
    adesioni: 'APP.DASHBOARD_PENDING.Adesioni',
    client: 'APP.DASHBOARD_PENDING.Client',
    comunicazioni: 'APP.DASHBOARD_PENDING.Comunicazioni',
    utenti: 'APP.DASHBOARD_PENDING.Utenti'
  };

  // Section API model map
  private readonly _sectionModels: { [key: string]: string } = {
    servizi: 'servizi',
    adesioni: 'adesioni',
    client: 'client',
    comunicazioni: 'notifiche',
    utenti: 'utenti'
  };

  constructor(
    private readonly router: Router,
    private readonly translate: TranslateService,
    private readonly configService: ConfigService,
    private readonly authenticationService: AuthenticationService,
    private readonly dashboardService: DashboardService,
    private readonly apiService: OpenAPIService,
    private readonly utils: UtilService
  ) {}

  ngOnInit() {
    this._loadConfigs();
  }

  private _loadConfigs() {
    const appConfig = this.configService.getConfiguration();
    this.hideVersions = appConfig?.AppConfig?.Services?.hideVersions || false;

    // Dashboard config deve essere caricato prima di _initRoleConfig/_loadData
    this.configService.getConfig('dashboard').subscribe((config: any) => {
      this.showSummaryCards = config?.showSummaryCards !== false;
      this.sectionsConfig = config?.sections || {};
      this._initRoleConfig();
    });
    this.configService.getConfig('servizi').subscribe((config: any) => {
      this.serviziStatusConfig = config?.options?.status?.values || {};
      this._updateComunicazioniStatusConfig();
    });
    this.configService.getConfig('adesioni').subscribe((config: any) => {
      this.adesioniStatusConfig = config?.options?.status?.values || {};
      this._updateComunicazioniStatusConfig();
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

  getExpandedSectionTitle(): string {
    if (this.expandedSection) {
      return this._sectionTitles[this.expandedSection] || '';
    }
    return '';
  }

  getExpandedStatusConfig(): any {
    switch (this.expandedSection) {
      case 'servizi': return this.serviziStatusConfig;
      case 'adesioni': return this.adesioniStatusConfig;
      case 'client': return this.clientStatusConfig;
      case 'comunicazioni': return this.comunicazioniStatusConfig;
      case 'utenti': return this.utentiStatusConfig;
      default: return {};
    }
  }

  private _updateComunicazioniStatusConfig() {
    this.comunicazioniStatusConfig = { ...this.serviziStatusConfig, ...this.adesioniStatusConfig };
  }

  getStatusStyle(stato: string): { [key: string]: string } {
    const cfg = this.getExpandedStatusConfig()[stato];
    if (cfg) {
      return { 'background-color': cfg.background, 'color': cfg.color, 'border': 'none' };
    }
    return { 'background-color': '#6c757d', 'color': '#ffffff' };
  }

  getStatusLabel(stato: string): string {
    const cfg = this.getExpandedStatusConfig()[stato];
    return cfg?.label || stato;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  private _initRoleConfig() {
    const user: any = this.authenticationService.getUser();
    const ruolo = user?.ruolo || '';

    // Per gestore/coordinatore: config immediata, non serve GET /profilo/ruoli
    if (ruolo === 'gestore' || ruolo === 'coordinatore') {
      this.roleConfig = this.dashboardService.computeRoleConfig(ruolo, []);
      this._loadData();
      return;
    }

    // Per referente: prima fetch ruoli, poi config, poi dati
    this.dashboardService.getRuoliProfilo().subscribe({
      next: (profilo) => {
        this.roleConfig = this.dashboardService.computeRoleConfig(
          profilo.ruolo, profilo.ruoli_referente || []
        );
        this._loadData();
      },
      error: () => {
        // Fallback: solo comunicazioni
        this.roleConfig = this.dashboardService.computeRoleConfig(ruolo, []);
        this._loadData();
      }
    });
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

  // --- Expanded view methods ---

  onSummaryClick(section: string) {
    if (this.expandedSection === section) {
      this.onCollapseExpanded();
    } else {
      this.expandedSection = section;
      this.expandedFilterData = null;
      this._loadExpandedData(section);
    }
  }

  onViewAll(panelType: string) {
    this.onSummaryClick(panelType);
  }

  onCollapseExpanded() {
    this.expandedSection = null;
    this.expandedItems = [];
    this.expandedTotal = 0;
    this.expandedFilterData = null;
    this._expandedLinks = null;
    this._expandedPreventMultiCall = false;
  }

  onExpandedSearch(values: any) {
    this.expandedFilterData = values;
    if (this.expandedSection) {
      this._loadExpandedData(this.expandedSection, values);
    }
  }

  _loadExpandedData(section: string, query: any = null, url: string = '') {
    const model = this._sectionModels[section];
    if (!model) return;

    if (!url) {
      this.expandedItems = [];
      this._expandedLinks = null;
    }

    let _params = query ? this.utils._queryToHttpParams(query) : new HttpParams();
    _params = _params.set('dashboard', 'true');
    let aux: any = { params: _params };

    this.expandedLoading = true;
    this.apiService.getList(model, aux, url).subscribe({
      next: (response: any) => {
        this._expandedLinks = response?._links || null;

        if (response?.page) {
          this.expandedTotal = response.page.totalElements || 0;
        }

        if (response?.content) {
          const newItems = response.content;
          this.expandedItems = url ? [...this.expandedItems, ...newItems] : [...newItems];
          this._expandedPreventMultiCall = false;
        }

        this.expandedLoading = false;
      },
      error: () => {
        this.expandedLoading = false;
        this._expandedPreventMultiCall = false;
      }
    });
  }

  __loadMoreExpandedData() {
    if (this._expandedLinks?.next && !this._expandedPreventMultiCall && this.expandedSection) {
      this._expandedPreventMultiCall = true;
      this._loadExpandedData(this.expandedSection, null, this._expandedLinks.next.href);
    }
  }


  onExpandedViewItem(item: any) {
    if (!this.expandedSection) return;
    this.onViewItem(item, this.expandedSection);
  }

  onViewItem(item: any, panelType: string) {
    switch (panelType) {
      case 'servizi':
        if (item.id_servizio) {
          this.router.navigate(['/servizi', item.id_servizio], { queryParams: { from: 'dashboard' } });
        }
        break;
      case 'adesioni':
        if (item.id_adesione) {
          this.router.navigate(['/adesioni', item.id_adesione], { queryParams: { from: 'dashboard' } });
        }
        break;
      case 'client':
        if (item.id_client) {
          this.router.navigate(['/client', item.id_client], { queryParams: { from: 'dashboard' } });
        }
        break;
      case 'comunicazioni': {
        const notificaId = item.id_notifica;
        const messageId = item.entita?.id_entita;
        const servizio = item.entita?.servizio;
        const adesione = item.entita?.adesione;
        const tipoUrl = (item.tipo?.tipo === 'comunicazione') ? '/comunicazioni?' : '?';

        let url = '';
        if (servizio) {
          url = `/servizi/${servizio.id_servizio}${tipoUrl}notificationId=${notificaId}&messageid=${messageId}&from=dashboard`;
        } else if (adesione) {
          url = `/adesioni/${adesione.id_adesione}${tipoUrl}notificationId=${notificaId}&messageid=${messageId}&from=dashboard`;
        } else {
          this.router.navigate(['/notifications']);
          break;
        }
        this.router.navigateByUrl(url);
        break;
      }
      case 'utenti':
        if (item.id_utente) {
          this.router.navigate(['/utenti', item.id_utente], { queryParams: { from: 'dashboard' } });
        }
        break;
    }
  }

  onRefresh() {
    this.isRefreshing = true;
    this._loadData();
    if (this.expandedSection) {
      this._loadExpandedData(this.expandedSection, this.expandedFilterData);
    }
    setTimeout(() => { this.isRefreshing = false; }, 600);
  }
}
