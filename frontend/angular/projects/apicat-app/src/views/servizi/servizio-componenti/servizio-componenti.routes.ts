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
import { Routes } from '@angular/router';

import { ServizioComponentiComponent } from './servizio-componenti.component';
import { ServizioDetailsComponent } from '../servizio-details/servizio-details.component';

import { ComponentBreadcrumbsResolver } from '../route-resolver/component-breadcrumbs.resolver';

export const SERVIZIO_COMPONENTI_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Componenti' },
        component: ServizioComponentiComponent
      },
      {
        path: ':cid',
        data: { breadcrumb: 'Componenti' },
        component: ServizioDetailsComponent,
        // loadChildren: () => import('../../../views/servizi/servizio-details/servizio-details.routes').then(m => m.SERVIZIO_DETAILS_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/allegati',
        loadChildren: () => import('../../../views/servizi/servizio-allegati/servizio-allegati.routes').then(m => m.SERVIZIO_ALLEGATI_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/referenti',
        loadChildren: () => import('../../../views/servizi/servizio-referenti/servizio-referenti.routes').then(m => m.SERVIZIO_REFERENTI_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/gruppi',
        loadChildren: () => import('../../../views/servizi/servizio-gruppi/servizio-gruppi.routes').then(m => m.SERVIZIO_GRUPPI_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/api',
        loadChildren: () => import('../../../views/servizi/servizio-api/servizio-api.routes').then(m => m.SERVIZIO_API_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/comunicazioni',
        loadChildren: () => import('../../../views/servizi/servizio-comunicazioni/servizio-comunicazioni.routes').then(m => m.SERVIZIO_COMUNICAZIONI_ROUTES),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      }
    ]
  }
];
