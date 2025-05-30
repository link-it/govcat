import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';

import { NotificationBarModule } from '../../notifications/notification-bar/notification-bar.module';

import { AdesioneComunicazioniComponent } from './adesione-comunicazioni.component';
import { AdesioneComunicazioniRoutingModule } from './adesione-comunicazioni-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    AdesioneComunicazioniRoutingModule,
    NotificationBarModule
  ],
  declarations: [
    AdesioneComunicazioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioneComunicazioniModule { }
