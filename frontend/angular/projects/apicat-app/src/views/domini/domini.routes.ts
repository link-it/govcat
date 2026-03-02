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

import { DominiComponent } from './domini.component';
import { DominioDetailsComponent } from './dominio-details/dominio-details.component';

export const DOMINI_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Domini' },
        component: DominiComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: DominioDetailsComponent
      },
      {
        path: ':id/referenti',
        data: { breadcrumb: 'Referenti' },
        loadChildren: () => import('./dominio-referenti/dominio-referenti.routes').then(m => m.DOMINIO_REFERENTI_ROUTES)
      }
    ]
  }
];
