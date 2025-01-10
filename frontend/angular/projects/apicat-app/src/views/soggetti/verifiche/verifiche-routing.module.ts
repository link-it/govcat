import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VerificheComponent } from './verifiche.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Verifiche' },
        component: VerificheComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class VerificheRoutingModule {}
