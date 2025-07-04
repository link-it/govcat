import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { NotificationBarModule } from '../../notifications/notification-bar/notification-bar.module';

import { ServizioComunicazioniComponent } from './servizio-comunicazioni.component';
import { ServizioComunicazioniRoutingModule } from './servizio-comunicazioni-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioComunicazioniRoutingModule,
    NotificationBarModule
  ],
  declarations: [
    ServizioComunicazioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioComunicazioniModule { }
