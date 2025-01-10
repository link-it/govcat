import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
// import { BackWebModule } from '../components/back-web/back-web.module';

import { ClientVerificheComponent } from './client-verifiche.component';
import { ClientVerificheRoutingModule } from './client-verifiche-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    // BackWebModule,
    ClientVerificheRoutingModule
  ],
  declarations: [
    ClientVerificheComponent
  ],
  exports: [ClientVerificheComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientVerificheModule { }
