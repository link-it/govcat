import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
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
