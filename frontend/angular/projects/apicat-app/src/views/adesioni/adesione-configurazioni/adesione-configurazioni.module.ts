import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
// import { WorkflowModule } from '@app/components/workflow/workflow.module';

import { AdesioneConfigurazioniComponent } from './adesione-configurazioni.component';
import { AdesioneConfigurazioniRoutingModule } from './adesione-configurazioni-routing.module';
import { MonitorDropdwnModule } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.module';

import { ApiCustomPropertiesModule } from '@app/components/api-custom-properties/api-custom-properties.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
             ComponentsModule,
        HasPermissionModule,
        MarkAsteriskModule,
        // WorkflowModule,
        AdesioneConfigurazioniRoutingModule,
        MonitorDropdwnModule,
        ApiCustomPropertiesModule
    ],
    declarations: [
        AdesioneConfigurazioniComponent
    ],
    exports: [AdesioneConfigurazioniComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioneConfigurazioniModule { }
