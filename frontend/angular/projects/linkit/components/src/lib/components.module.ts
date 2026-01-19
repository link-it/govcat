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
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TranslateModule } from '@ngx-translate/core';;
import { FALLBACK, GravatarConfig, GravatarModule, RATING } from 'ngx-gravatar';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxMasonryModule } from 'ngx-masonry';
import { MarkdownModule } from 'ngx-markdown';

import { HeadBarComponent } from './head-bar/head-bar.component';
import { SpinnerComponent } from './spinner/spinner.component';

import { directives } from './directives';
import { ui, uiServices } from './ui';
import { pipes } from './pipes';
import { dialogs, standaloneDialogs, MultiSnackbarComponent } from './dialogs';
import { defineCustomElements } from 'xml-viewer-component/dist/loader';

const gravatarConfig: GravatarConfig = {
  fallback: FALLBACK.mm,
  rating: RATING.g,
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderColor: 'rgba(255, 255, 255, 1)',
  hasBorder: true, // Set this flag to true to have a border by default
};

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TooltipModule,
    TranslateModule,
    GravatarModule.forRoot(gravatarConfig),
    ModalModule,
    BsDatepickerModule,
    InfiniteScrollDirective,
    NgSelectModule,
    NgxChartsModule,
    NgxMasonryModule,
    MarkdownModule,
    ...standaloneDialogs
  ],
  declarations: [
    HeadBarComponent,
    SpinnerComponent,

    ...pipes,
    ...directives,
    ...ui,
    ...dialogs
  ],
  exports: [
    HeadBarComponent,
    SpinnerComponent,

    ...ui,
    ...pipes,
    ...directives,
    ...dialogs,
    ...standaloneDialogs,

    FormsModule,
    ReactiveFormsModule,
    TooltipModule,
    ModalModule,
    BsDatepickerModule,
    TranslateModule,
    GravatarModule,
    InfiniteScrollDirective,
    NgSelectModule,
    NgxChartsModule,
    NgxMasonryModule
  ],
  providers: [
    ...uiServices,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ComponentsModule { }

defineCustomElements(window);

export {
  HeadBarComponent,
  SpinnerComponent,
  MultiSnackbarComponent
};
