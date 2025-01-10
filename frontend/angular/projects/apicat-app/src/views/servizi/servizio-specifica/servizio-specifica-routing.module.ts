import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioSpecificaComponent } from './servizio-specifica.component';
// import { ServizioSpecificaDetailsComponent } from '../servizio-specifica-details/servizio-specifica-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Allegati specifica' },
        component: ServizioSpecificaComponent
      },
      // {
      //   path: ':aid',
      //   data: { breadcrumb: ':id' },
      //   component: ServizioSpecificaDetailsComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioSpecificaRoutingModule {}
