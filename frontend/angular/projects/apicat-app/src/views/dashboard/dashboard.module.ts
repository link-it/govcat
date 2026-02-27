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

import { AppComponentsModule } from '@app/components/components.module';

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardPanelModule } from './dashboard-panel/dashboard-panel.module';

import { ClientsSearchFormModule } from './search-forms/clients-search-form/clients-search-form.module';
import { ServiziSearchFormModule } from './search-forms/servizi-search-form/servizi-search-form.module';
import { AdesioniSearchFormModule } from './search-forms/adesioni-search-form/adesioni-search-form.module';
import { UtentiSearchFormModule } from './search-forms/utenti-search-form/utenti-search-form.module';
import { ComunicazioniSearchFormModule } from './search-forms/comunicazioni-search-form/comunicazioni-search-form.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    AppComponentsModule,
    DashboardRoutingModule,
    DashboardPanelModule,
    ClientsSearchFormModule,
    ServiziSearchFormModule,
    AdesioniSearchFormModule,
    UtentiSearchFormModule,
    ComunicazioniSearchFormModule
  ],
  declarations: [
    DashboardComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DashboardModule { }
