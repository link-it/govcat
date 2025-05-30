import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { BsLocaleService } from 'ngx-bootstrap/datepicker';
import { getSetGlobalLocale } from 'ngx-bootstrap/chronos';

 import { ComponentsModule } from '@linkit/components';
// import { BackWebModule } from '../components/back-web/back-web.module';

import { StatisticheComponent } from './statistiche.component';
import { StatisticheRoutingModule } from './statistiche-routing.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk';
import { TimepickerConfig } from 'ngx-bootstrap/timepicker';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // BackWebModule,
    StatisticheRoutingModule,
    MarkAsteriskModule
  ],
  declarations: [
    StatisticheComponent
  ],
  providers: [
    {
      provide: TimepickerConfig, useValue: Object.assign(new TimepickerConfig(), {
        showMeridian: false,
        showMinutes: false,
      })
    }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class StatisticheModule { 
  constructor(bootstrapLocale: BsLocaleService) {
    bootstrapLocale.use(getSetGlobalLocale());
  }
}
