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
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { OrganizationContextService } from '@services/organization-context.service';

/**
 * Header inviato dal FE su ogni chiamata privata per indicare al BE
 * l'organizzazione di sessione corrente. Il BE lo usa per filtrare
 * le risposte e applicare i permessi multi-org.
 */
export const ORG_CONTEXT_HEADER = 'X-Organization-Context';

/**
 * Endpoint per i quali l'header `X-Organization-Context` NON deve
 * essere inviato. Vengono confrontati come substring sull'URL della
 * richiesta. Includere qui i path globali / di catalogo / di
 * configurazione che non dipendono dall'organizzazione di sessione.
 */
const EXCLUDED_URL_PATTERNS: string[] = [
    '-config.json',
    '/configurazione',
    '/profilo'
];

/**
 * Aggiunge l'header `X-Organization-Context` quando esiste un'org di
 * sessione. Le richieste verso URL nella lista `EXCLUDED_URL_PATTERNS`
 * o senza org corrente passano inalterate. Separato dall'
 * `OAuthInterceptor` per mantenere autenticazione e contesto
 * multi-org indipendenti.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationContextInterceptor implements HttpInterceptor {

    private readonly organizationContextService = inject(OrganizationContextService);

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        if (this._isExcluded(req.url)) {
            return next.handle(req);
        }
        const idOrg = this.organizationContextService.getCurrentOrganization()?.id_organizzazione;
        if (!idOrg) {
            return next.handle(req);
        }
        const cloned = req.clone({
            headers: req.headers.set(ORG_CONTEXT_HEADER, idOrg)
        });
        return next.handle(cloned);
    }

    private _isExcluded(url: string): boolean {
        return EXCLUDED_URL_PATTERNS.some(pattern => url.includes(pattern));
    }
}
