import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
;
import { MarkAsteriskModule } from '@app/directives/mark-asterisk';
import { PdndComponent } from './pdnd.component';
import { PdndRoutingModule } from './pdnd-routing.module';
import { PdndEServiceViewComponent } from './components/pdnd-eservice-view.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    // BackWebModule,
    PdndRoutingModule,
    MarkAsteriskModule
  ],
  declarations: [
    PdndComponent,
    PdndEServiceViewComponent
  ],
  exports: [PdndEServiceViewComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PdndModule { }
