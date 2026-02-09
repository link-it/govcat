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
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { ErrorViewModule } from '@app/components/error-view/error-view.module';
import { SelectionDropdownModule } from '@app/components/selection-dropdown/selection-dropdown.module';
import { ExportDropdwnModule } from '@app/components/lnk-ui/export-dropdown/export-dropdown.module';

import { AdesioniComponent } from './adesioni.component';
import { AdesioniRoutingModule } from './adesioni-routing.module';
import { AdesioneDetailsModule } from './adesione-details/adesione-details.module';
import { AdesioneViewModule } from './adesione-view/adesione-view.module';
import { AdesioneConfigurazioneWizardModule } from './adesione-configurazione-wizard/adesione-configurazione-wizard.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    ErrorViewModule,
    SelectionDropdownModule,
    ExportDropdwnModule,
    AdesioniRoutingModule,
    AdesioneDetailsModule,
    AdesioneViewModule,
    AdesioneConfigurazioneWizardModule
  ],
  declarations: [
    AdesioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AdesioniModule { }
