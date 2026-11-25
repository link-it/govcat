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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

import { AuthenticationService } from '@app/services/authentication.service';
import { OpenAPIService } from '@app/services/openAPI.service';
import { apiConAuditInAmbienti, auditAbilitato, MENU_AUDIT_ATTIVO } from '@app/views/servizi/transazioni/audit';

import { ConfigService, MenuAction } from '@linkit/components';

@Component({
  selector: 'app-monitor-dropdown',
  templateUrl: './monitor-dropdown.component.html',
  styleUrls: ['./monitor-dropdown.component.scss'],
  standalone: true,
  imports: [TranslateModule]
})
export class MonitorDropdwnComponent implements OnInit, OnChanges {

  @Input() service_id: string | null = null;
  @Input() showComunications: boolean = true;
  @Input() showMonitoring: boolean = true;
  @Input() showManagement: boolean = true;
  @Input() returnWeb: boolean = false;
  @Input() returnWebTitle: string = 'APP.MENU.BackView';
  @Input() otherActions: any[] = [];
  /**
   * Voci aggiuntive appese in fondo al menu (dopo le voci interne come
   * monitoring/management/backview). Utile per azioni "ultime in lista"
   * tipo l'eliminazione di un'entita'.
   */
  @Input() bottomActions: any[] = [];
  /** Voce della pagina corrente, esclusa dal menu. */
  @Input() currentAction: string | null = null;
  /** Voce per tornare alla vetrina del servizio, insieme alla gestione. */
  @Input() showVetrina: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();

  _menuActions: MenuAction[] = [];

  _showMonitoraggio: boolean = true;
  _showTransazioni: boolean = true;
  _showStatistiche: boolean = true;
  _showVerifiche: boolean = true;
  _showAudit: boolean = false;
  _hasApiAudit: boolean = false;
  _menuAuditAttivo: boolean = MENU_AUDIT_ATTIVO;
  _showCommunicationsMenuConfig: boolean = true;

  appConfig: any;

  private _monitoraggio: any = null;
  private _servizioApiAudit: string | null = null;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private apiService: OpenAPIService
  ) {
    this.appConfig = this.configService.getConfiguration();
    this._showCommunicationsMenuConfig = this.appConfig?.AppConfig?.Layout?.showCommunicationsMenu !== false;
  }

  ngOnInit() {
    const monitoraggio = this.authenticationService._getConfigModule('monitoraggio');
    this._monitoraggio = monitoraggio;
    this._showTransazioni = monitoraggio?.transazioni_abilitate || false;
    this._showStatistiche = monitoraggio?.statistiche_abilitate || false;
    this._showVerifiche = monitoraggio?.verifiche_abilitate || false;
    this._showAudit = this._menuAuditAttivo && auditAbilitato(monitoraggio);
    // I ruoli abilitati si verificano sul grant del servizio nel componente che valorizza `showMonitoring`
    this._showMonitoraggio = monitoraggio?.abilitato && (this._showStatistiche || this._showTransazioni || this._showVerifiche || this._showAudit);

    this._loadApiAudit();
    this.initMenu();
  }

  ngOnChanges(changes: SimpleChanges) {
    this._loadApiAudit();
    this.initMenu();
  }

  /** La voce Audit richiede almeno un'API del servizio con l'audit in un ambiente. */
  private _loadApiAudit() {
    if (!this._showAudit || !this.showMonitoring || !this.service_id || this._servizioApiAudit === this.service_id) {
      return;
    }
    const _servizio = this.service_id;
    this._servizioApiAudit = _servizio;
    this._hasApiAudit = false;
    this.apiService.getList('api', { params: { id_servizio: _servizio, size: '100' } }).subscribe({
      next: (response: any) => {
        if (this.service_id !== _servizio) { return; }
        const _proprieta = this._monitoraggio?.proprieta_audit || [];
        this._hasApiAudit = (response?.content || []).some((api: any) => apiConAuditInAmbienti(api, _proprieta));
        this.initMenu();
      },
      error: () => {
        this._servizioApiAudit = null;
      }
    });
  }

  initMenu() {
    const _monitoraggio = this.showMonitoring && this._showMonitoraggio;
    const _transazioni = _monitoraggio && this._showTransazioni && this.currentAction !== 'transazioni';
    const _statistiche = _monitoraggio && this._showStatistiche && this.currentAction !== 'statistiche';
    const _audit = _monitoraggio && this._showAudit && this._hasApiAudit && this.currentAction !== 'audit';
    const _verifiche = _monitoraggio && this._showVerifiche && this.currentAction !== 'verifiche';
    const _vociMonitoraggio = _transazioni || _statistiche || _audit || _verifiche;
    const _comunicazioni = this.showComunications && this._showCommunicationsMenuConfig && this.currentAction !== 'comunicazioni';
    const _menuActions = [
      // new MenuAction({
      //   type: 'label',
      //   title: 'APP.MENU.Management',
      //   enabled: true
      // }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Communications',
        icon: 'chat-left',
        subTitle: '',
        action: 'comunicazioni',
        enabled: _comunicazioni
      }),
      new MenuAction({
        type: 'divider',
        enabled: _comunicazioni && (_vociMonitoraggio || this.showManagement || this.returnWeb || this.showVetrina)
      }),
      new MenuAction({
        type: 'label',
        title: 'APP.MENU.Monitoring',
        enabled: _vociMonitoraggio
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Transactions',
        icon: 'arrow-left-right',
        subTitle: '',
        action: 'transazioni',
        enabled: _transazioni
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Statistics',
        icon: 'graph-up',
        subTitle: '',
        action: 'statistiche',
        enabled: _statistiche
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Audit',
        icon: 'journal-text',
        subTitle: '',
        action: 'audit',
        enabled: _audit
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Checks',
        icon: 'shield-check',
        subTitle: '',
        action: 'verifiche',
        enabled: _verifiche
      }),
      new MenuAction({
        type: 'divider',
        enabled: _vociMonitoraggio && (this.showManagement || this.returnWeb || this.showVetrina || this.bottomActions.length > 0)
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Management',
        icon: 'pencil',
        subTitle: '',
        action: 'gestione',
        enabled: this.showManagement && !this.returnWeb
      }),
      new MenuAction({
        type: 'menu',
        title: this.returnWebTitle,
        icon: 'eye',
        subTitle: '',
        action: 'backview',
        enabled: this.returnWeb
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.GoToView',
        icon: 'eye',
        subTitle: '',
        action: 'vetrina',
        enabled: this.showVetrina && !this.returnWeb
      }),
    ];

    this._menuActions = [
      ...this.otherActions,
      // new MenuAction({
      //   type: 'divider',
      //   enabled: this.otherActions.length
      // }),
      ..._menuActions,
      ...this.bottomActions
    ];
  }

  onAction(menu: any) {
    this.action.emit({action: menu.action});
  }
}
