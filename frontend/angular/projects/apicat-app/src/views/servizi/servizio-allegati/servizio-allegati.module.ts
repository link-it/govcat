import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioAllegatiComponent } from './servizio-allegati.component';
import { ServizioAllegatiRoutingModule } from './servizio-allegati-routing.module';
// import { ServizioAllegatiDetailsModule } from '../servizio-allegati-details/servizio-allegati-details.module';

import { AllegatiDialogModule } from '@app/components/allegati-dialog/allegati-dialog.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    // BackWebModule,
    MonitorDropdwnModule,
    ServizioAllegatiRoutingModule,
    // ServizioAllegatiDetailsModule,
    AllegatiDialogModule
  ],
  declarations: [
    ServizioAllegatiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioAllegatiModule { }
