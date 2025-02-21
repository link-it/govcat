import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { BreadcrumbModule } from 'projects/components/src/lib/ui/breadcrumb/breadcrumb.module';

import { AppComponentsModule } from "@app/components/components.module";
import { ErrorViewModule } from '@app/components/error-view/error-view.module';
import { WorkflowModule } from '@app/components/workflow/workflow.module';
import { MonitorDropdwnModule } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { AdesioneConfigurazioneWizardRoutingModule } from './adesione-configurazione-wizard-routing.module';
import { AdesioneConfigurazioneWizardComponent } from './adesione-configurazione-wizard.component';
import { AdesioneListaClientsComponent } from './adesione-lista-clients/adesione-lista-clients.component';
import { AdesioneListaErogazioniComponent } from './adesione-lista-erogazioni/adesione-lista-erogazioni.component';
import { ModalAddReferentComponent } from './modal-add-referent/modal-add-referent.component';
import { AdesioneFormComponent } from './adesione-form/adesione-form.component';

import { ApiCustomPropertiesModule } from '@app/components/api-custom-properties/api-custom-properties.module';

@NgModule({
  declarations: [
    AdesioneConfigurazioneWizardComponent,
    AdesioneListaClientsComponent,
    AdesioneListaErogazioniComponent,
    ModalAddReferentComponent,
    AdesioneFormComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    BreadcrumbModule,
    AppComponentsModule,
    ErrorViewModule,
    WorkflowModule,
    MonitorDropdwnModule,
    HasPermissionModule,
    MarkAsteriskModule,
    AdesioneConfigurazioneWizardRoutingModule,
    ApiCustomPropertiesModule
  ]
})
export class AdesioneConfigurazioneWizardModule { }
