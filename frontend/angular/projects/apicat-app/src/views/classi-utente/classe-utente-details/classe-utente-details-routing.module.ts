import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClasseUtenteDetailsComponent } from './classe-utente-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ClasseUtenteDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClasseUtenteDetailsRoutingModule {}
