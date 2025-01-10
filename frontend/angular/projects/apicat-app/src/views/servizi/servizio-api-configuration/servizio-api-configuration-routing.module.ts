import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioApiConfigurationComponent } from './servizio-api-configuration.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: ':id_ambiente',
        data: { breadcrumb: 'Configuration' },
        component: ServizioApiConfigurationComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioApiConfigurationRoutingModule {}
