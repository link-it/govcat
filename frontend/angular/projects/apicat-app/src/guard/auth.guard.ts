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

import { AuthenticationService } from '../services/authentication.service';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private readonly router: Router,
    private readonly authenticationService: AuthenticationService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authenticationService.isLogged()) {
      // Dopo redirect OAuth, ripristina il returnUrl salvato prima del flusso SSO
      const ssoReturnUrl = sessionStorage.getItem('sso_return_url');
      if (ssoReturnUrl) {
        sessionStorage.removeItem('sso_return_url');
        if (state.url !== ssoReturnUrl) {
          this.router.navigateByUrl(ssoReturnUrl);
          return false;
        }
      }
      return true;
    }

    this.router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url }});
    return false;
  }
}
