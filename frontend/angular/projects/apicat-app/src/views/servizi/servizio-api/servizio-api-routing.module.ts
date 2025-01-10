import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioApiComponent } from './servizio-api.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'List API' },
        component: ServizioApiComponent
      },
      {
        path: ':aid',
        data: { breadcrumb: 'Dettaglio API' },
        loadChildren: () => import('../servizio-api-details/servizio-api-details.module').then(m => m.ServizioApiDetailsModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioApiRoutingModule {}
