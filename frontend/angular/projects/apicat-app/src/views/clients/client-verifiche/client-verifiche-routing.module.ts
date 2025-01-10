import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientVerificheComponent } from './client-verifiche.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Verifiche' },
        component: ClientVerificheComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClientVerificheRoutingModule {}
