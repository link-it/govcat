import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioApiComponent } from './servizio-api.component';
import { ServizioApiRoutingModule } from './servizio-api-routing.module';
import { ServizioApiDetailsModule } from '../servizio-api-details/servizio-api-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioApiRoutingModule,
    ServizioApiDetailsModule
  ],
  declarations: [
    ServizioApiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioApiModule { }
