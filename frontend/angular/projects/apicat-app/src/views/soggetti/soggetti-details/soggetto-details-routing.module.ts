import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SoggettoDetailsComponent } from './soggetto-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: SoggettoDetailsComponent
      },
      {
        path: ':id/verifiche',
        data: { breadcrumb: 'Verifiche' },
        loadChildren: () => import('../verifiche/verifiche.module').then(m => m.VerificheModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SoggettoDetailsRoutingModule {}
