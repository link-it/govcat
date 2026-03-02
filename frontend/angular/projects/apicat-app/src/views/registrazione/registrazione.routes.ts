import { Routes } from '@angular/router';

import { RegistrazioneComponent } from './registrazione.component';

export const REGISTRAZIONE_ROUTES: Routes = [
  {
    path: '',
    component: RegistrazioneComponent,
    data: { title: 'Registrazione' }
  }
];
