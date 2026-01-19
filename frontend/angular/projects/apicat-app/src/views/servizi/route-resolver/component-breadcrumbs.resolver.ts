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
import {
  Router, Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';
import { OpenAPIService } from '@app/services/openAPI.service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Servizio } from '../servizio-details/servizio';

import { TranslateService } from '@ngx-translate/core';

export interface ComponentBreadcrumbsData {service: Servizio, breadcrumbs: any[]};

@Injectable({
  providedIn: 'root'
})
export class ComponentBreadcrumbsResolver implements Resolve<{service: Servizio, breadcrumbs: any[]}> {
  constructor (
    private translate: TranslateService,
    private apiService: OpenAPIService
  ) {}

  resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<{service: Servizio, breadcrumbs: any[]}> {
    const serviceId = route.params['id'];
    return this.apiService.getDetails('servizi', serviceId).pipe(
      map((response: any) => {
        const service = new Servizio({ ...response });
        const title = service.nome + ' v. ' + service.versione;
        const _toolTipServizio = service ? this.translate.instant('APP.WORKFLOW.STATUS.' + service.stato) : '';
        const breadcrumbs = [
          { label: 'APP.TITLE.Services', url: '/servizi', type: 'link', iconBs: 'grid-3x3-gap' },
          { label: title, url: `/servizi/${service.id_servizio}` , type: 'link', tooltip: _toolTipServizio }
        ];

        return { service, breadcrumbs };
      })
    );
  }
}
