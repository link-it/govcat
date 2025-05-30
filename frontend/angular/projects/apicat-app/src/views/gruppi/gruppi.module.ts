import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { TreeViewModule } from '@app/components/tree-view/tree-view.module';

import { GruppiRoutingModule } from './gruppi-routing.module';
import { GruppiComponent } from './gruppi.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
             ComponentsModule,
        HasPermissionModule,
        MarkAsteriskModule,
        TreeViewModule,
        GruppiRoutingModule
    ],
    declarations: [
        GruppiComponent
    ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class GruppiModule { }
