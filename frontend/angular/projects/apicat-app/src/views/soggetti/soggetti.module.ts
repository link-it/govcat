import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { SoggettiRoutingModule } from './soggetti-routing.module';
import { SoggettiComponent } from './soggetti.component';
import { SoggettoDetailsModule } from './soggetti-details/soggetto-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    SoggettiRoutingModule,
    SoggettoDetailsModule
  ],
  declarations: [
    SoggettiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SoggettiModule { }
