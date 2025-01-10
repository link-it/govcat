import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TransazioniComponent } from './transazioni.component';
import { TransazioneDetailsComponent } from './transazione-details/transazione-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Transazioni' },
        component: TransazioniComponent
      },
      {
        path: ':tid',
        data: { breadcrumb: 'Dettaglio transazione' },
        component: TransazioneDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TransazioniRoutingModule {}
