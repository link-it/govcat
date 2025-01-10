import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UtentiComponent } from './utenti.component';
import { UtenteDetailsComponent } from './utente-details/utente-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Users' },
        component: UtentiComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: UtenteDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UtentiRoutingModule {}
