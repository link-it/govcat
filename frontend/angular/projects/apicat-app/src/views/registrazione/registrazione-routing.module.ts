import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegistrazioneComponent } from './registrazione.component';

const routes: Routes = [
  {
    path: '',
    component: RegistrazioneComponent,
    data: { title: 'Registrazione' }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistrazioneRoutingModule {}
