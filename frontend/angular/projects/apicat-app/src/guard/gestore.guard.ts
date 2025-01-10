import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class GestoreGuard implements CanActivate {

  appConfig: any = null;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService
  ) {
    this.appConfig = this.configService.getAppConfig();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    // this._showTaxonomies = this._config.AppConfig.Layout.showTaxonomies || false;
    // const _showTaxonomies = this.appConfig.Layout.showTaxonomies || false;
    const _taxonomiesRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
    const _showTaxonomies = _taxonomiesRemoteConfig.tassonomie_abilitate || false;
    if (state.url === '/tassonomie' && !_showTaxonomies) {
      this.router.navigate(['/servizi']);
      return false;  
    }
    if (state.url === '/dashboard') {
      const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
      const _hasDashboard = _dashboardRemoteConfig.abilitato || false;
      if (_hasDashboard) {
        if (this.authenticationService.isGestore()) {
          return true;
        }
      }
      this.router.navigate(['/servizi']);
      return false;
    } else {
      if (this.authenticationService.isGestore()) {
        return true;
      }
    }
    this.router.navigate(['/servizi']);
    return false;
  }
}
