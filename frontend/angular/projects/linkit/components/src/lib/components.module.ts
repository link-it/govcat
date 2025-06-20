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
import { MultiSnackbarComponent } from './dialogs/multi-snackbar/multi-snackbar.component';

import { directives } from './directives';
import { ui, uiServices } from './ui';
import { pipes } from './pipes';
import { dialogs } from './dialogs';
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
    MarkdownModule
  ],
  declarations: [
    HeadBarComponent,
    SpinnerComponent,
    MultiSnackbarComponent,

    ...pipes,
    ...directives,
    ...ui,
    ...dialogs
  ],
  exports: [
    HeadBarComponent,
    SpinnerComponent,
    MultiSnackbarComponent,

    ...ui,
    ...pipes,
    ...directives,
    ...dialogs,

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
