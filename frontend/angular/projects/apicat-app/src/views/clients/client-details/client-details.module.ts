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

import { ClientDetailsComponent } from './client-details.component';
import { ClientDetailsRoutingModule } from './client-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    HasPermissionModule,
    ClientDetailsRoutingModule,
    MarkAsteriskModule,
    WorkflowModule,
    ErrorViewModule
  ],
  declarations: [
    ClientDetailsComponent
  ],
  exports: [ClientDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientDetailsModule { }
