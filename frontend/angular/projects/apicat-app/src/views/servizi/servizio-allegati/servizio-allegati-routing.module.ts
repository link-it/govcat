import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioAllegatiComponent } from './servizio-allegati.component';
// import { ServizioAllegatiDetailsComponent } from '../servizio-allegati-details/servizio-allegati-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'allegati' },
        component: ServizioAllegatiComponent
      },
      // {
      //   path: ':aid',
      //   data: { breadcrumb: ':id' },
      //   component: ServizioAllegatiDetailsComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioAllegatiRoutingModule {}
