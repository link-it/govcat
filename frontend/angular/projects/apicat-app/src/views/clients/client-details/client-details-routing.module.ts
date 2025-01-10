import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientDetailsComponent } from './client-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ClientDetailsComponent
      },
      {
        path: ':id/adesioni',
        data: { breadcrumb: 'Adesioni' },
        loadChildren: () => import('../client-adesioni/client-adesioni.module').then(m => m.ClientAdesioniModule)
      },
      {
        path: ':id/verifiche',
        data: { breadcrumb: 'Verifiche' },
        loadChildren: () => import('../client-verifiche/client-verifiche.module').then(m => m.ClientVerificheModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClientDetailsRoutingModule {}
