import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioComunicazioniComponent } from './servizio-comunicazioni.component';
// import { ServizioMessageComponent } from '../servizio-comunicazioni/servizio-comunicazioni.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Comunicazioni' },
        component: ServizioComunicazioniComponent
      },
      // {
      //   path: ':id',
      //   data: { breadcrumb: ':id' },
      //   component: ServizioMessageComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioComunicazioniRoutingModule {}
