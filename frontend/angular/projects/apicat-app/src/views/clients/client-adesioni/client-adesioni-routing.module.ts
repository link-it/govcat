import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClientAdesioniComponent } from './client-adesioni.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Adesioni' },
        component: ClientAdesioniComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ClientAdesioniRoutingModule {}
