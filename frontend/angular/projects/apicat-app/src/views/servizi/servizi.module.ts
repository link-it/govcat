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
import { MarkdownModule } from 'ngx-markdown';

import { ComponentsModule } from '@linkit/components';
import { AppComponentsModule } from "@app/components/components.module";
import { TassonomiaTokenModule } from '@app/components/token/tassonomia-token.module';

import { ServiziComponent } from './servizi.component';
import { ServiziRoutingModule } from './servizi-routing.module';
import { ServizioDetailsModule } from './servizio-details/servizio-details.module';
import { ServizioViewModule } from './servizio-view/servizio-view.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        MarkdownModule,
        ComponentsModule,
        AppComponentsModule,
        TassonomiaTokenModule,
        ServiziRoutingModule,
        ServizioDetailsModule,
        ServizioViewModule
    ],
    declarations: [
        ServiziComponent
    ],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ServiziModule { }
