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

import { OrganizzazioneManageComponent } from './organizzazione-manage.component';
import { DominioDetailsComponent } from '../domini/dominio-details/dominio-details.component';

export const ORGANIZZAZIONE_MANAGE_ROUTES: Routes = [
  {
    path: ':id',
    component: OrganizzazioneManageComponent,
    data: { title: 'Gestione Organizzazione' }
  },
  // Issue 229 evolutiva multi-org/domini — child routes per il
  // CRUD dei domini nel contesto della pagina di gestione
  // organizzazione. Riusano il componente `DominioDetailsComponent`
  // che, in presenza di `data.fromOrgManage`, adatta breadcrumb
  // e navigazione di ritorno (back -> `/organizzazione-manage/:id`).
  {
    path: ':id/domini/new',
    component: DominioDetailsComponent,
    data: { title: 'Nuovo dominio', fromOrgManage: true }
  },
  {
    path: ':id/domini/:idDominio',
    component: DominioDetailsComponent,
    data: { title: 'Dominio', fromOrgManage: true }
  },
  // Referenti del dominio nel contesto org-manage. Il param dominio
  // qui e` `:idDominio` (mentre la route standard `/domini/:id/referenti`
  // usa `:id`): la component referenti normalizza i due param.
  {
    path: ':id/domini/:idDominio/referenti',
    loadChildren: () => import('../domini/dominio-referenti/dominio-referenti.routes').then(m => m.DOMINIO_REFERENTI_ROUTES),
    data: { title: 'Referenti dominio', fromOrgManage: true }
  }
];
