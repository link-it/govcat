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
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';
import { AuthenticationService } from '../services/authentication.service';
import { DashboardService } from '../services/dashboard.service';

@Injectable()
export class DashboardGuard implements CanActivate {

  constructor(
    private readonly router: Router,
    private readonly authenticationService: AuthenticationService,
    private readonly configService: ConfigService,
    private readonly dashboardService: DashboardService
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, _state: RouterStateSnapshot): Observable<boolean> | boolean {
    const appConfig = this.configService.getAppConfig();
    const dashboardEnabled = appConfig?.Layout?.dashboard?.enabled || false;
    if (!dashboardEnabled) {
      this.router.navigate(['/servizi']);
      return false;
    }
    if (this.authenticationService.isAnonymous()) {
      this.router.navigate(['/servizi']);
      return false;
    }

    const user: any = this.authenticationService.getUser();
    const ruolo = user?.ruolo || '';

    // Se ha un ruolo principale, può accedere
    if (ruolo) {
      return true;
    }

    // Se non ha un ruolo principale, verifica se ha ruoli_referente
    return this.dashboardService.getRuoliProfilo().pipe(
      map(profilo => {
        const hasRuoli = profilo.ruoli_referente && profilo.ruoli_referente.length > 0;
        if (hasRuoli) {
          return true;
        }
        this.router.navigate(['/servizi']);
        return false;
      }),
      catchError(() => {
        this.router.navigate(['/servizi']);
        return of(false);
      })
    );
  }
}
