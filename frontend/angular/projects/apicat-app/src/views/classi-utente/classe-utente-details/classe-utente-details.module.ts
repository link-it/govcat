import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { ClasseUtenteDetailsComponent } from './classe-utente-details.component';
import { ClasseUtenteDetailsRoutingModule } from './classe-utente-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    ClasseUtenteDetailsRoutingModule
  ],
  declarations: [
    ClasseUtenteDetailsComponent
  ],
  exports: [ClasseUtenteDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClasseUtenteDetailsModule { }
