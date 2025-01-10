import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioMessaggiComponent } from './servizio-messaggi.component';
// import { ServizioMessaggiDetailsComponent } from '../servizio-messaggi-details/servizio-messaggi-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Messaggi' },
        component: ServizioMessaggiComponent
      },
      // {
      //   path: ':mid',
      //   data: { breadcrumb: ':id' },
      //   component: ServizioMessaggiDetailsComponent
      // }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioMessaggiRoutingModule {}
