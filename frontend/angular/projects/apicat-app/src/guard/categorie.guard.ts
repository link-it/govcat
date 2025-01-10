import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class CategorieGuard implements CanActivate {

  appConfig: any = null;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService
  ) {
    this.appConfig = this.configService.getAppConfig();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    const _taxonomiesRemoteConfig: any = this.authenticationService._getConfigModule('servizio');
    const _showTaxonomies = _taxonomiesRemoteConfig.tassonomie_abilitate || false;
    if (state.url.includes('/categorie') && !_showTaxonomies) {
      this.router.navigate(['/servizi']);
      return false;
    }
    return true;
  }
}
