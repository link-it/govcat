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
