import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { ClassiUtenteRoutingModule } from './classi-utente-routing.module';
import { ClassiUtenteComponent } from './classi-utente.component';
import { ClasseUtenteDetailsModule } from './classe-utente-details/classe-utente-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    ClassiUtenteRoutingModule,
    ClasseUtenteDetailsModule
  ],
  declarations: [
    ClassiUtenteComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClassiUtenteModule { }
