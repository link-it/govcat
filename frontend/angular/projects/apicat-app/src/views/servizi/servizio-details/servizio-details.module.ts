import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';

import { AppComponentsModule } from "@app/components/components.module";
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { DisablePermissionModule } from '@app/directives/disable-permission/disable-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { WorkflowModule } from '@app/components/workflow/workflow.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { ModalGroupChoiceModule } from '@app/components/modal-group-choice/modal-group-choice.module';
import { ModalCategoryChoiceModule } from '@app/components/modal-category-choice/modal-category-choice.module';
import { ErrorViewModule } from '@app/components/error-view/error-view.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ServizioDetailsComponent } from './servizio-details.component';
import { ServizioDetailsRoutingModule } from './servizio-details-routing.module';

import { NotificationBarModule } from '../../notifications/notification-bar/notification-bar.module';
import { MarkdownModule } from 'ngx-markdown';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ComponentsModule,
        AppComponentsModule,
        HasPermissionModule,
        DisablePermissionModule,
        MarkAsteriskModule,
        WorkflowModule,
        // BackWebModule,
        ModalGroupChoiceModule,
        ModalCategoryChoiceModule,
        ErrorViewModule,
        MonitorDropdwnModule,
        ServizioDetailsRoutingModule,
        NotificationBarModule,
        MarkdownModule
    ],
    declarations: [
        ServizioDetailsComponent
    ],
    exports: [ServizioDetailsComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioDetailsModule { }
