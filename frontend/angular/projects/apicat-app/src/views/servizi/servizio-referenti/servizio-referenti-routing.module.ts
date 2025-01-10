import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioReferentiComponent } from './servizio-referenti.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Referenti' },
        component: ServizioReferentiComponent
      },
      // {
      //   path: ':id',
      //   data: { breadcrumb: ':id' },
      //   component: ServizioReferentComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioReferentiRoutingModule {}
