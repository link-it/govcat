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
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { OpenAPIService } from '../services/openAPI.service';

/**
 * Pagina di gestione di un servizio: richiede almeno un ruolo dell'utente sul servizio (grant).
 * Senza ruoli (es. servizio visibile in vetrina di un'altra organizzazione) rimanda alla vista del servizio.
 * Se il grant non si può leggere decide la pagina, che gestisce già l'errore.
 */
export const gestioneServizioGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const apiService = inject(OpenAPIService);
  const _idServizio = route.paramMap.get('id');
  if (!_idServizio) {
    return true;
  }
  const _vista = router.createUrlTree(['/servizi', _idServizio, 'view']);
  return apiService.getDetails('servizi', _idServizio, 'grant').pipe(
    map((grant: any) => (grant?.ruoli?.length ? true : _vista)),
    catchError(() => of(true))
  );
};
