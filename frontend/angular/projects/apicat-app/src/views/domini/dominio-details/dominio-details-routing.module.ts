import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DominioDetailsComponent } from './dominio-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: DominioDetailsComponent
      },
      {
        path: ':id/referenti',
        data: { breadcrumb: 'Referents' },
        loadChildren: () => import('../dominio-referenti/dominio-referenti.module').then(m => m.DominioReferentiModule)
      },
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class DominioDetailsRoutingModule {}
