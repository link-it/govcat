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

import { ServizioApiComponent } from './servizio-api.component';
import { ServizioApiDetailsComponent } from '../servizio-api-details/servizio-api-details.component';

export const SERVIZIO_API_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'List API' },
        component: ServizioApiComponent
      },
      {
        path: ':aid',
        data: { breadcrumb: 'Dettaglio API' },
        component: ServizioApiDetailsComponent
      },
      {
        path: ':aid/allegati',
        data: { breadcrumb: 'Allegati Api' },
        loadChildren: () => import('../servizio-api-allegati/servizio-api-allegati.routes').then(m => m.SERVIZIO_API_ALLEGATI_ROUTES)
      },
      {
        path: ':aid/subscribers',
        data: { breadcrumb: 'Subscribers' },
        loadChildren: () => import('../servizio-api-subscribers/servizio-api-subscribers.routes').then(m => m.SERVIZIO_API_SUBSCRIBERS_ROUTES)
      },
      {
        path: ':aid/pdnd-informations',
        data: { breadcrumb: 'PDND General informations' },
        loadChildren: () => import('../servizio-api-pdnd-informations/servizio-api-pdnd-informations.routes').then(m => m.SERVIZIO_API_PDND_INFORMATIONS_ROUTES)
      },
      {
        path: ':aid/configuration',
        data: { breadcrumb: 'Configuration' },
        loadChildren: () => import('../servizio-api-configuration/servizio-api-configuration.routes').then(m => m.SERVIZIO_API_CONFIGURATION_ROUTES)
      }
    ]
  }
];
