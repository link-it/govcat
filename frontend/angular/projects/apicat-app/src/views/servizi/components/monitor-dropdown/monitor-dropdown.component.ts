import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';

import { AuthenticationService } from '@app/services/authentication.service';

import { MenuAction } from '@linkit/components';

@Component({
  selector: 'app-monitor-dropdown',
  templateUrl: './monitor-dropdown.component.html',
  styleUrls: ['./monitor-dropdown.component.scss'],
  standalone: false
})
export class MonitorDropdwnComponent implements OnInit, OnChanges {

  @Input() service_id: string | null = null;
  @Input() showComunications: boolean = true;
  @Input() showMonitoring: boolean = true;
  @Input() showManagement: boolean = true;
  @Input() returnWeb: boolean = false;
  @Input() returnWebTitle: string = 'APP.MENU.BackView';
  @Input() otherActions: any[] = [];

  @Output() action: EventEmitter<any> = new EventEmitter();

  _menuActions: MenuAction[] = [];

  _showMonitoraggio: boolean = true;
  _showTransazioni: boolean = true;
  _showStatistiche: boolean = true;
  _showVerifiche: boolean = true;
  _hasRole: boolean = false;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService
  ) {}

  ngOnInit() {
    const monitoraggio = this.authenticationService._getConfigModule('monitoraggio');
    this._showTransazioni = monitoraggio?.transazioni_abilitate || false;
    this._showStatistiche = monitoraggio?.statistiche_abilitate || false;
    this._showVerifiche = monitoraggio?.verifiche_abilitate || false;
    this._showMonitoraggio = monitoraggio?.abilitato && (this._showStatistiche || this._showTransazioni || this._showVerifiche);
    const _ruoli = monitoraggio?.ruoli_abilitati;
    this._hasRole = _ruoli.length > 0 ? this.authenticationService.hasRole(_ruoli) : false;

    this.initMenu();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.initMenu();
  }

  initMenu() {
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
        enabled: this.showComunications
      }),
      new MenuAction({
        type: 'divider',
        enabled: this.showComunications && (this.showMonitoring || this.showManagement || this.showManagement || this.returnWeb)
      }),
      new MenuAction({
        type: 'label',
        title: 'APP.MENU.Monitoring',
        enabled: this.showMonitoring && this._showMonitoraggio && this._hasRole
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Transactions',
        icon: 'arrow-left-right',
        subTitle: '',
        action: 'transazioni',
        enabled: this.showMonitoring && this._showMonitoraggio && this._showTransazioni && this._hasRole
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Statistics',
        icon: 'graph-up',
        subTitle: '',
        action: 'statistiche',
        enabled: this.showMonitoring && this._showMonitoraggio && this._showStatistiche && this._hasRole
      }),
      new MenuAction({
        type: 'menu',
        title: 'APP.MENU.Checks',
        icon: 'shield-check',
        subTitle: '',
        action: 'verifiche',
        enabled: this.showMonitoring && this._showMonitoraggio && this._showVerifiche && this._hasRole
      }),
      new MenuAction({
        type: 'divider',
        enabled: this.showMonitoring && this._showMonitoraggio && this._hasRole
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
    ];

    this._menuActions = [
      ...this.otherActions,
      // new MenuAction({
      //   type: 'divider',
      //   enabled: this.otherActions.length
      // }),
      ..._menuActions
    ];
  }

  onAction(menu: any) {
    this.action.emit({action: menu.action});
  }
}
