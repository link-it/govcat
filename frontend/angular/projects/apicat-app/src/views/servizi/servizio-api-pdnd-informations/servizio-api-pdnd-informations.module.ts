import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioApiPdndInformationsComponent } from './servizio-api-pdnd-informations.component';
import { ServizioApiPdndInformationsRoutingModule } from './servizio-api-pdnd-informations-routing.module';
import { PdndModule } from '../../pdnd/pdnd.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioApiPdndInformationsRoutingModule,
    PdndModule
  ],
  declarations: [
    ServizioApiPdndInformationsComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioApiPdndInformationsModule { }
