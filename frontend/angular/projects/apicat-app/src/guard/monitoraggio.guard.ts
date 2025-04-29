import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class MonitoraggioGuard implements CanActivate {

  appConfig: any = null;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService
  ) {
    this.appConfig = this.configService.getAppConfig();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const _monitoraggioConfig: any = this.authenticationService._getConfigModule('monitoraggio');
    const _showMonitoraggio = _monitoraggioConfig?.abilitato || false;
    if (_showMonitoraggio) {
      const _ruoli = _monitoraggioConfig?.ruoli_abilitati;
      return _ruoli.length > 0 ? this.authenticationService.hasRole(_ruoli) : true;
    }
    this.router.navigate(['/servizi']);
    return false;
  }
}
