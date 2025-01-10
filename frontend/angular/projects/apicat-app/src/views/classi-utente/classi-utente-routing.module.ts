import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClassiUtenteComponent } from './classi-utente.component';
import { ClasseUtenteDetailsComponent } from './classe-utente-details/classe-utente-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'ClassiUtente' },
        component: ClassiUtenteComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: ClasseUtenteDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClassiUtenteRoutingModule {}
