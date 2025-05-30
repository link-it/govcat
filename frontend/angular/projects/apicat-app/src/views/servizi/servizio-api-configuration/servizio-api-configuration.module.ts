import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioApiConfigurationComponent } from './servizio-api-configuration.component';
import { ServizioApiConfigurationRoutingModule } from './servizio-api-configuration-routing.module';
import { HasPermissionModule } from '@app/directives/has-permission';
import { DisablePermissionModule } from '@app/directives/disable-permission/disable-permission.module';
import { ServiceFiltersModule } from '@app/pipes/service-filters.module';
import { ModalChoicesModule } from '@app/components/modal-choices/modal-choices.module';
// import { PdndCustomFormModule } from './pdnd-custom-form/pdnd-custom-form.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    MonitorDropdwnModule,
    ServizioApiConfigurationRoutingModule,
    HasPermissionModule,
    DisablePermissionModule,
    ServiceFiltersModule,
    ModalChoicesModule
  ],
  declarations: [
    ServizioApiConfigurationComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioApiConfigurationModule { }
