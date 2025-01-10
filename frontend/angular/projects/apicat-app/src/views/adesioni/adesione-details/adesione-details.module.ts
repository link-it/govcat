import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { WorkflowModule } from '@app/components/workflow/workflow.module';
import { ErrorViewModule } from '@app/components/error-view/error-view.module';

import { AdesioneDetailsComponent } from './adesione-details.component';
import { AdesioneDetailsRoutingModule } from './adesione-details-routing.module';

import { NotificationBarModule } from '../../notifications/notification-bar/notification-bar.module';
import { MonitorDropdwnModule } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.module';

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
    ErrorViewModule,
    AdesioneDetailsRoutingModule,
    NotificationBarModule,
    MonitorDropdwnModule
  ],
  declarations: [
    AdesioneDetailsComponent
  ],
  exports: [AdesioneDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioneDetailsModule { }
