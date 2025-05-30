import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { ErrorViewModule } from '@app/components/error-view/error-view.module';

import { OrganizzazioneDetailsComponent } from './organizzazione-details.component';
import { OrganizzazioneDetailsRoutingModule } from './organizzazione-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    OrganizzazioneDetailsRoutingModule,
    MarkAsteriskModule,
    ErrorViewModule
  ],
  declarations: [
    OrganizzazioneDetailsComponent
  ],
  exports: [OrganizzazioneDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrganizzazioneDetailsModule { }
