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
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioApiDetailsComponent } from './servizio-api-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'API' },
        component: ServizioApiDetailsComponent
      },
      {
        path: ':aid/allegati',
        data: { breadcrumb: 'Allegati Api' },
        loadChildren: () => import('../servizio-api-allegati/servizio-api-allegati.module').then(m => m.ServizioApiAllegatiModule)
      },
      // {
      //   path: ':aid/allegati-specifica',
      //   data: { breadcrumb: 'Allegati Api Specifica' },
      //   loadChildren: () => import('../servizio-api-allegati/servizio-api-allegati.module').then(m => m.ServizioApiAllegatiModule)
      // },
      {
        path: ':aid/subscribers',
        data: { breadcrumb: 'Subscribers' },
        loadChildren: () => import('../servizio-api-subscribers/servizio-api-subscribers.module').then(m => m.ServizioApiSubscribersModule)
      },
      {
        path: ':aid/pdnd-informations',
        data: { breadcrumb: 'PDND General informations' },
        loadChildren: () => import('../servizio-api-pdnd-informations/servizio-api-pdnd-informations.module').then(m => m.ServizioApiPdndInformationsModule)
      },
      {
        path: ':aid/configuration',
        data: { breadcrumb: 'Configuration' },
        loadChildren: () => import('../servizio-api-configuration/servizio-api-configuration.module').then(m => m.ServizioApiConfigurationModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioApiDetailsRoutingModule {}
