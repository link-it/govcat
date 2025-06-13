import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioReferentiComponent } from './servizio-referenti.component';
import { ServizioReferentiRoutingModule } from './servizio-referenti-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioReferentiRoutingModule
  ],
  declarations: [
    ServizioReferentiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioReferentiModule { }
