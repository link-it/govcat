import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioGruppiComponent } from './servizio-gruppi.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Gruppi' },
        component: ServizioGruppiComponent
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
export class ServizioGruppiRoutingModule {}
