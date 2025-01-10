import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioneReferentiComponent } from './adesione-referenti.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Referenti' },
        component: AdesioneReferentiComponent
      },
      // {
      //   path: ':id',
      //   data: { breadcrumb: ':id' },
      //   component: AdesioneReferentComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneReferentiRoutingModule {}
