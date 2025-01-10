import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransazioneDetailsComponent } from './transazione-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: TransazioneDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransazioneDetailsRoutingModule {}
