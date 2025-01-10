import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioneComunicazioniComponent } from './adesione-comunicazioni.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Comunicazioni' },
        component: AdesioneComunicazioniComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneComunicazioniRoutingModule {}
