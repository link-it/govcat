import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { AppComponentsModule } from "@app/components/components.module";
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { WorkflowModule } from '@app/components/workflow/workflow.module';
import { ScrollModule } from '@app/components/scroll/scroll.module';
import { SwaggerModule } from '@app/components/swagger/swagger.module';
import { WsdlModule } from '@app/components/wsdl/wsdl.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioViewComponent } from './servizio-view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        VendorsModule,
        ComponentsModule,
        AppComponentsModule,
        HasPermissionModule,
        MarkAsteriskModule,
        WorkflowModule,
        ScrollModule,
        SwaggerModule,
        WsdlModule,
        MonitorDropdwnModule
    ],
    declarations: [
        ServizioViewComponent
    ],
    exports: [ServizioViewComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioViewModule { }
