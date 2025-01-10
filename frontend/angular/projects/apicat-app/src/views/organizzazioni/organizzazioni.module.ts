import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { OrganizzazioniComponent } from './organizzazioni.component';
import { OrganizzazioniRoutingModule } from './organizzazioni-routing.module';
import { OrganizzazioneDetailsModule } from './organizzazione-details/organizzazione-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    HasPermissionModule,
    OrganizzazioniRoutingModule,
    OrganizzazioneDetailsModule
  ],
  declarations: [
    OrganizzazioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class OrganizzazioniModule { }
