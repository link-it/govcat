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
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { ConfigService } from '@linkit/components';
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
