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

import { AdesioneDetailsComponent } from './adesione-details.component';

const routes: Routes = [
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
        loadChildren: () => import('../adesione-referenti/adesione-referenti.module').then(m => m.AdesioneReferentiModule)
      },
      {
        path: ':id/comunicazioni',
        data: { breadcrumb: 'comunicazioni' },
        loadChildren: () => import('../adesione-comunicazioni/adesione-comunicazioni.module').then(m => m.AdesioneComunicazioniModule)
      },
      {
        path: ':id/configurazioni',
        data: { breadcrumb: 'configurazioni' },
        loadChildren: () => import('../adesione-configurazioni/adesione-configurazioni.module').then(m => m.AdesioneConfigurazioniModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneDetailsRoutingModule {}
