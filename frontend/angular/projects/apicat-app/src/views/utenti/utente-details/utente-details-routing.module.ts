import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UtenteDetailsComponent } from './utente-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: UtenteDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class UtenteDetailsRoutingModule {}
