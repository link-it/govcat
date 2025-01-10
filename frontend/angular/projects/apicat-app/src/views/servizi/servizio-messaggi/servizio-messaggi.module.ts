import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioMessaggiComponent } from './servizio-messaggi.component';
import { ServizioMessaggiRoutingModule } from './servizio-messaggi-routing.module';
// import { ServizioMessaggiDetailsModule } from '../servizio-messaggi-details/servizio-messaggi-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    MonitorDropdwnModule,
    ServizioMessaggiRoutingModule,
    // ServizioMessaggiDetailsModule
  ],
  declarations: [
    ServizioMessaggiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioMessaggiModule { }
