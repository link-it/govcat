import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioApiPdndInformationsComponent } from './servizio-api-pdnd-informations.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Pdnd General Informations' },
        component: ServizioApiPdndInformationsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioApiPdndInformationsRoutingModule {}
