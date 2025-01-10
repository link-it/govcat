import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioneDetailsComponent } from './adesione-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AdesioneDetailsComponent
      },
      {
        path: ':id/referenti',
        data: { breadcrumb: 'Referents' },
        loadChildren: () => import('../adesione-referenti/adesione-referenti.module').then(m => m.AdesioneReferentiModule)
      },
      {
        path: ':id/comunicazioni',
        data: { breadcrumb: 'comunicazioni' },
        loadChildren: () => import('../adesione-comunicazioni/adesione-comunicazioni.module').then(m => m.AdesioneComunicazioniModule)
      },
      {
        path: ':id/configurazioni',
        data: { breadcrumb: 'configurazioni' },
        loadChildren: () => import('../adesione-configurazioni/adesione-configurazioni.module').then(m => m.AdesioneConfigurazioniModule)
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneDetailsRoutingModule {}
