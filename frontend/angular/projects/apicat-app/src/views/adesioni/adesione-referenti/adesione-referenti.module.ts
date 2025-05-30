import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { AdesioneReferentiComponent } from './adesione-referenti.component';
import { AdesioneReferentiRoutingModule } from './adesione-referenti-routing.module';
import { MonitorDropdwnModule } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    AdesioneReferentiRoutingModule,
    MonitorDropdwnModule
  ],
  declarations: [
    AdesioneReferentiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioneReferentiModule { }
