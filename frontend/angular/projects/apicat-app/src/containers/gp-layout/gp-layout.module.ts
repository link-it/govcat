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
import { CommonModule } from '@angular/common';
import { NgModule} from '@angular/core';

import {
    BrandMinimizeDirective,
    MobileSidebarToggleDirective,
    SidebarMinimizeDirective,
    SidebarOffCanvasCloseDirective,
    HtmlAttributesDirective,
    FlyOutDirective
} from './gp-layout.directive';

import {} from './gp-layout.directive';

import { AboutDialogModule } from '../../components/about-dialog/about-dialog.module';

@NgModule({
    imports: [
        CommonModule,
        AboutDialogModule
    ],
    exports: [
        BrandMinimizeDirective,
        MobileSidebarToggleDirective,
        SidebarMinimizeDirective,
        SidebarOffCanvasCloseDirective,
        HtmlAttributesDirective,
        FlyOutDirective
    ],
    declarations: [
        BrandMinimizeDirective,
        MobileSidebarToggleDirective,
        SidebarMinimizeDirective,
        SidebarOffCanvasCloseDirective,
        HtmlAttributesDirective,
        FlyOutDirective
    ],
    providers: []
})
export class GpLayoutModule { }
