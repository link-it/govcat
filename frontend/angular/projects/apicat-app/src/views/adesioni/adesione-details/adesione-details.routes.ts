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

import { AdesioneDetailsComponent } from './adesione-details.component';

export const ADESIONE_DETAILS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AdesioneDetailsComponent
      },
      {
        path: ':id/referenti',
        data: { breadcrumb: 'Referents' },
        loadChildren: () => import('../adesione-referenti/adesione-referenti.routes').then(m => m.ADESIONE_REFERENTI_ROUTES)
      },
      {
        path: ':id/comunicazioni',
        data: { breadcrumb: 'comunicazioni' },
        loadChildren: () => import('../adesione-comunicazioni/adesione-comunicazioni.routes').then(m => m.ADESIONE_COMUNICAZIONI_ROUTES)
      },
      {
        path: ':id/configurazioni',
        data: { breadcrumb: 'configurazioni' },
        loadChildren: () => import('../adesione-configurazioni/adesione-configurazioni.routes').then(m => m.ADESIONE_CONFIGURAZIONI_ROUTES)
      }
    ]
  }
];
