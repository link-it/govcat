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
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { AppComponentsModule } from '@app/components/components.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { DisablePermissionModule } from '@app/directives/disable-permission/disable-permission.module';
import { ServiceFiltersModule } from '@app/pipes/service-filters.module';
// import { BackWebModule } from '../components/back-web/back-web.module';
import { MonitorDropdwnModule } from '../components/monitor-dropdown/monitor-dropdown.module';

import { ModalChoicesModule } from '@app/components/modal-choices/modal-choices.module';

import { ServizioApiDetailsComponent } from './servizio-api-details.component';
import { ServizioApiDetailsRoutingModule } from './servizio-api-details-routing.module';

@NgModule({
    imports: [
        CommonModule,
        TranslateModule,
             ComponentsModule,
        AppComponentsModule,
        MarkAsteriskModule,
        HasPermissionModule,
        DisablePermissionModule,
        ServiceFiltersModule,
        // BackWebModule,
        MonitorDropdwnModule,
        ModalChoicesModule,
        ServizioApiDetailsRoutingModule
    ],
    declarations: [
        ServizioApiDetailsComponent
    ],
    exports: [ServizioApiDetailsComponent],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServizioApiDetailsModule { }
