import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SoggettiComponent } from './soggetti.component';
import { SoggettoDetailsComponent } from './soggetti-details/soggetto-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Soggetti' },
        component: SoggettiComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: SoggettoDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class SoggettiRoutingModule {}
