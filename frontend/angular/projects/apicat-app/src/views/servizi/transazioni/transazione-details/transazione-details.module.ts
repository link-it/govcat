import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { WorkflowModule } from '@app/components/workflow/workflow.module';
// import { BackWebModule } from '../../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../../components/monitor-dropdown/monitor-dropdown.module';

import { TransazioneDetailsComponent } from './transazione-details.component';
import { TransazioneDetailsRoutingModule } from './transazione-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    HasPermissionModule,
    MarkAsteriskModule,
    WorkflowModule,
    // BackWebModule,
    MonitorDropdwnModule,
    TransazioneDetailsRoutingModule
  ],
  declarations: [
    TransazioneDetailsComponent
  ],
  exports: [TransazioneDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TransazioneDetailsModule { }
