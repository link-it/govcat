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

import { ServiziComponent } from './servizi.component';
import { ServizioDetailsComponent } from './servizio-details/servizio-details.component';
import { ServizioViewComponent } from './servizio-view/servizio-view.component';
import { ServiceBreadcrumbsResolver } from './route-resolver/service-breadcrumbs.resolver';

import { ForbidAnonymousGuard } from '@app/guard/forbid-anonymous.guard';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Servizi' },
        component: ServiziComponent
      },
      {
        path: ':id',
        canActivate: [ForbidAnonymousGuard],
        data: { breadcrumb: 'Dettaglio servizio' },
        component: ServizioDetailsComponent
      },
      {
        path: ':sid/view',
        data: { breadcrumb: 'Visualizzazione servizio' },
        component: ServizioViewComponent
      },
      {
        path: ':id/adesioni', 
        canActivate: [ForbidAnonymousGuard],
        loadChildren: () => import('../../views/adesioni/adesioni.module').then(m => m.AdesioniModule),
        resolve: { serviceBreadcrumbs: ServiceBreadcrumbsResolver }
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServiziRoutingModule {}
