import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioApiAllegatiComponent } from './servizio-api-allegati.component';
import { ServizioApiAllegatiRoutingModule } from './servizio-api-allegati-routing.module';
// import { ServizioApiAllegatiDetailsModule } from '../servizio-api-allegati-details/servizio-api-allegati-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioApiAllegatiRoutingModule,
    // ServizioApiAllegatiDetailsModule
  ],
  declarations: [
    ServizioApiAllegatiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioApiAllegatiModule { }
