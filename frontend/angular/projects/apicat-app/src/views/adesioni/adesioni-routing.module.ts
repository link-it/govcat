import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioniComponent } from './adesioni.component';
import { AdesioneDetailsComponent } from './adesione-details/adesione-details.component';
import { AdesioneViewComponent } from './adesione-view/adesione-view.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AdesioniComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: AdesioneDetailsComponent
      },
      {
        path: ':id/view',
        data: { breadcrumb: 'Visualizzazione servizio' },
        component: AdesioneViewComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioniRoutingModule {}
