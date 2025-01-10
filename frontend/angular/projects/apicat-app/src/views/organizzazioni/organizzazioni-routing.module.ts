import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrganizzazioniComponent } from './organizzazioni.component';
import { OrganizzazioneDetailsComponent } from './organizzazione-details/organizzazione-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Organizzazioni' },
        component: OrganizzazioniComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: OrganizzazioneDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrganizzazioniRoutingModule {}
