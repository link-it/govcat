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
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { OpenAPIService } from '@app/services/openAPI.service';
import { GrantRole } from '@app/services/grant-roles.const';

/**
 * Ruoli dell'utente sul servizio per monitoraggio e gestione.
 * Il backend assegna all'operatore API dell'organizzazione erogatrice lo stesso ruolo `referente`
 * dei referenti del servizio: il ruolo resta solo se l'utente è tra i referenti.
 */
export function ruoliServizio(ruoli: string[] | null | undefined, referenteServizio: boolean): string[] {
    const _ruoli = ruoli || [];
    return referenteServizio ? _ruoli : _ruoli.filter((ruolo: string) => ruolo !== GrantRole.Referente);
}

/** Ruoli del grant, verificando tra i referenti del servizio il solo ruolo `referente`. */
export function ruoliServizio$(apiService: OpenAPIService, idServizio: string, ruoli: string[] | null | undefined, idUtente: string | null | undefined): Observable<string[]> {
    const _ruoli = ruoli || [];
    if (!_ruoli.includes(GrantRole.Referente)) {
        return of(_ruoli);
    }
    const _params = { tipo_referente: 'referente', size: '100' };
    return apiService.getDetails('servizi', idServizio, 'referenti', { params: _params }).pipe(
        map((response: any) => {
            const _referente = !!idUtente && (response?.content || []).some((item: any) => item?.utente?.id_utente === idUtente);
            return ruoliServizio(_ruoli, _referente);
        }),
        catchError(() => of(ruoliServizio(_ruoli, false)))
    );
}
