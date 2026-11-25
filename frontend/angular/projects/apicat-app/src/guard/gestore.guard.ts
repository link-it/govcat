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
import { catchError, map } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';
import { AuthenticationService } from '../services/authentication.service';
import { OpenAPIService } from '../services/openAPI.service';
import { configurazioneRemota$ } from './configurazione-remota';

/**
 * Accesso alle pagine di amministrazione: il gestore, oppure chi ha il permesso di lettura sul menu
 * nella configurazione `amministrazione`. Tassonomie e dashboard richiedono anche la funzione abilitata.
 * Dopo un ricaricamento della pagina la configurazione remota viene richiesta prima di decidere.
 */
@Injectable()
export class GestoreGuard implements CanActivate {

  appConfig: any = null;

  constructor(
    private router: Router,
    private authenticationService: AuthenticationService,
    private configService: ConfigService,
    private apiService: OpenAPIService
  ) {
    this.appConfig = this.configService.getAppConfig();
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const _negato = this.router.createUrlTree(['/servizi']);
    return configurazioneRemota$(this.apiService).pipe(
      catchError(() => of(null)),
      map((configurazione: any) => this._consentito(state.url.split('?')[0], configurazione) ? true : _negato)
    );
  }

  private _consentito(url: string, configurazione: any): boolean {
    if (url === '/tassonomie' && !configurazione?.servizio?.tassonomie_abilitate) {
      return false;
    }
    if (url === '/monitoraggio' && !configurazione?.dashboard?.abilitato) {
      return false;
    }
    const menu = url.split('/')[1];
    return this.authenticationService.isGestore()
      || this.authenticationService.verificacanPermessiMenuAmministrazione(menu, configurazione).canRead;
  }
}
