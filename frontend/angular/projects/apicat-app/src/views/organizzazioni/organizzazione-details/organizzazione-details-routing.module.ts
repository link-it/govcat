import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrganizzazioneDetailsComponent } from './organizzazione-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: OrganizzazioneDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrganizzazioneDetailsRoutingModule {}
