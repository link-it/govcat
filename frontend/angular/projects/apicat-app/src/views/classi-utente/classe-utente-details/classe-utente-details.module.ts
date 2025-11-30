import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { TrimOnBlurModule } from '@app/directives/trim-on-blur/trim-on-blur.module';

import { ClasseUtenteDetailsComponent } from './classe-utente-details.component';
import { ClasseUtenteDetailsRoutingModule } from './classe-utente-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ComponentsModule,
    HasPermissionModule,
    TrimOnBlurModule,
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
