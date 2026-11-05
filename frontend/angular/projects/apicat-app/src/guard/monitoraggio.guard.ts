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
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { OpenAPIService } from '../services/openAPI.service';
import { auditAbilitato } from '../views/servizi/transazioni/audit';

/**
 * Accesso alle pagine di monitoraggio di un servizio: monitoraggio abilitato e almeno un ruolo
 * dell'utente sul servizio (grant) incluso in `monitoraggio.ruoli_abilitati`, come per il menu.
 * Le rotte con `data.audit` richiedono anche il monitoraggio di audit abilitato.
 */
@Injectable()
export class MonitoraggioGuard implements CanActivate {

  constructor(
    private readonly router: Router,
    private readonly authenticationService: AuthenticationService,
    private readonly apiService: OpenAPIService
  ) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const _negato = this.router.createUrlTree(['/servizi']);
    const _idServizio = route.paramMap.get('id');
    if (!_idServizio) {
      return of(_negato);
    }
    // Al primo caricamento della pagina la configurazione remota non e` ancora disponibile
    const _monitoraggio: any = this.authenticationService._getConfigModule('monitoraggio');
    const _monitoraggio$: Observable<any> = _monitoraggio
      ? of(_monitoraggio)
      : this.apiService.getList('configurazione').pipe(map((config: any) => config?.monitoraggio));
    return _monitoraggio$.pipe(
      switchMap((monitoraggio: any) => {
        if (!monitoraggio?.abilitato || (route.data?.['audit'] && !auditAbilitato(monitoraggio))) {
          return of(_negato);
        }
        return this.apiService.getDetails('servizi', _idServizio, 'grant').pipe(
          map((grant: any) => this.authenticationService.canMonitoraggio(grant?.ruoli || [], monitoraggio) ? true : _negato)
        );
      }),
      catchError(() => of(_negato))
    );
  }
}
