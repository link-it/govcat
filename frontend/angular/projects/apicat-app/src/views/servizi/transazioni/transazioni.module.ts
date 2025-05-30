import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { TransazioniComponent } from './transazioni.component';
import { TransazioniRoutingModule } from './transazioni-routing.module';
import { TransazioneDetailsModule } from './transazione-details/transazione-details.module';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { getSetGlobalLocale } from 'ngx-bootstrap/chronos';
import { TimepickerConfig } from 'ngx-bootstrap/timepicker';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // BackWebModule,
    MonitorDropdwnModule,
    MarkAsteriskModule,
    TransazioniRoutingModule,
    TransazioneDetailsModule
  ],
  declarations: [
    TransazioniComponent
  ],
  providers: [
    {
      provide: TimepickerConfig, useValue: Object.assign(new TimepickerConfig(), {
        showMeridian: false,
      })
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TransazioniModule {
  constructor(bootstrapLocale: BsLocaleService) {
    bootstrapLocale.use(getSetGlobalLocale());
  }
}
