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
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthenticationService } from '../services/authentication.service';
import { OpenAPIService } from '../services/openAPI.service';
import { configurazioneRemota$ } from './configurazione-remota';

export type FunzioneMonitoraggio = 'transazioni' | 'statistiche' | 'verifiche';

/** Funzione di monitoraggio abilitata nella configurazione (`<funzione>_abilitate`), come per le voci di menu. */
export function funzioneMonitoraggioAbilitata(monitoraggio: any, funzione: FunzioneMonitoraggio | null | undefined): boolean {
  if (!monitoraggio?.abilitato) {
    return false;
  }
  return !funzione || !!monitoraggio[`${funzione}_abilitate`];
}

/** Configurazione del monitoraggio; al primo caricamento della pagina quella remota non è ancora disponibile. */
export function configurazioneMonitoraggio$(authenticationService: AuthenticationService, apiService: OpenAPIService): Observable<any> {
  const _monitoraggio: any = authenticationService._getConfigModule('monitoraggio');
  return _monitoraggio
    ? of(_monitoraggio)
    : configurazioneRemota$(apiService).pipe(map((config: any) => config?.monitoraggio));
}

/**
 * Accesso a una pagina di monitoraggio che non dipende dal grant di un servizio (es. verifiche di
 * soggetti e client): richiede la funzione `data.funzione` abilitata. Se negato riporta alla pagina superiore.
 */
export const funzioneMonitoraggioGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const router = inject(Router);
  const _negato = router.parseUrl(state.url.split('?')[0].replace(/\/[^/]+$/, '') || '/');
  return configurazioneMonitoraggio$(inject(AuthenticationService), inject(OpenAPIService)).pipe(
    map((monitoraggio: any) => funzioneMonitoraggioAbilitata(monitoraggio, route.data?.['funzione']) ? true : _negato),
    catchError(() => of(_negato))
  );
};
