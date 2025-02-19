import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioniComponent } from './adesioni.component';
import { AdesioneDetailsComponent } from './adesione-details/adesione-details.component';
import { AdesioneViewComponent } from './adesione-view/adesione-view.component';
import { AdesioneConfigurazioneWizardComponent } from './adesione-configurazione-wizard/adesione-configurazione-wizard.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AdesioniComponent
      },
      {
        path: ':id/edit',
        data: { breadcrumb: ':id/edit' },
        component: AdesioneDetailsComponent
      },
      {
        path: ':id/view',
        data: { breadcrumb: 'Visualizzazione adesione' },
        component: AdesioneViewComponent
      },
      {
        path: ':id',
        data: { breadcrumb: 'Configurazione Wizard' },
        component: AdesioneConfigurazioneWizardComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioniRoutingModule {}
