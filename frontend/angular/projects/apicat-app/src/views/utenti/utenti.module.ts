import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { UtentiComponent } from './utenti.component';
import { UtentiRoutingModule } from './utenti-routing.module';
import { UtenteDetailsModule } from './utente-details/utente-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    UtentiRoutingModule,
    UtenteDetailsModule
  ],
  declarations: [
    UtentiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class UtentiModule { }
