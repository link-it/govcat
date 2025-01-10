import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DominioReferentiComponent } from './dominio-referenti.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Referenti' },
        component: DominioReferentiComponent
      },
      // {
      //   path: ':id',
      //   data: { breadcrumb: ':id' },
      //   component: AdesioneReferentComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DominioReferentiRoutingModule {}
