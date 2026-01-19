/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';

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
     ComponentsModule,
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
