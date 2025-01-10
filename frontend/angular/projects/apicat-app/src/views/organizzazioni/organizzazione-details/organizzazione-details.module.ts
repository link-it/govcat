import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
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
    VendorsModule,
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
