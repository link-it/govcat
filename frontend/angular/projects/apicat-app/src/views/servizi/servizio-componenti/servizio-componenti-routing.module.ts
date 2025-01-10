import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioComponentiComponent } from './servizio-componenti.component';
import { ServizioDetailsComponent } from '../servizio-details/servizio-details.component';

import { ComponentBreadcrumbsResolver } from '../route-resolver/component-breadcrumbs.resolver';

const routes: Routes = [
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
        // loadChildren: () => import('../../../views/servizi/servizio-details/servizio-details.module').then(m => m.ServizioDetailsModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/allegati',
        loadChildren: () => import('../../../views/servizi/servizio-allegati/servizio-allegati.module').then(m => m.ServizioAllegatiModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/referenti',
        loadChildren: () => import('../../../views/servizi/servizio-referenti/servizio-referenti.module').then(m => m.ServizioReferentiModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/gruppi',
        loadChildren: () => import('../../../views/servizi/servizio-gruppi/servizio-gruppi.module').then(m => m.ServizioGruppiModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/api',
        loadChildren: () => import('../../../views/servizi/servizio-api/servizio-api.module').then(m => m.ServizioApiModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      },
      {
        path: ':cid/comunicazioni',
        loadChildren: () => import('../../../views/servizi/servizio-comunicazioni/servizio-comunicazioni.module').then(m => m.ServizioComunicazioniModule),
        resolve: { componentBreadcrumbs: ComponentBreadcrumbsResolver }
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioComponentiRoutingModule {}
