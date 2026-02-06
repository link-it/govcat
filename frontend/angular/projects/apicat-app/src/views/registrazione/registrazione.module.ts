import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { AppComponentsModule } from '@app/components/components.module';

import { RegistrazioneRoutingModule } from './registrazione-routing.module';
import { RegistrazioneComponent } from './registrazione.component';
import { StepConfermaEmailComponent } from './components/step-conferma-email/step-conferma-email.component';
import { StepModificaEmailComponent } from './components/step-modifica-email/step-modifica-email.component';
import { StepVerificaCodiceComponent } from './components/step-verifica-codice/step-verifica-codice.component';
import { StepCompletatoComponent } from './components/step-completato/step-completato.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ComponentsModule,
    AppComponentsModule,
    RegistrazioneRoutingModule
  ],
  declarations: [
    RegistrazioneComponent,
    StepConfermaEmailComponent,
    StepModificaEmailComponent,
    StepVerificaCodiceComponent,
    StepCompletatoComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class RegistrazioneModule { }
