import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioCategorieComponent } from './servizio-categorie.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Categorie' },
        component: ServizioCategorieComponent
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
export class ServizioCategorieRoutingModule {}
