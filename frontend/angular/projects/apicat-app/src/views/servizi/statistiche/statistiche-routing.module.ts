import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StatisticheComponent } from './statistiche.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Statistiche' },
        component: StatisticheComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class StatisticheRoutingModule {}
