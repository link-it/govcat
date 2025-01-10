import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DominiComponent } from './domini.component';
import { DominioDetailsComponent } from './dominio-details/dominio-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Domini' },
        component: DominiComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: DominioDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DominiRoutingModule {}
