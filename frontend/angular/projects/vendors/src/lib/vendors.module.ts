import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';

import { MarkdownModule } from 'ngx-markdown';
import { GravatarModule, GravatarConfig, FALLBACK, RATING } from 'ngx-gravatar';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { NgSelectModule } from '@ng-select/ng-select';

const gravatarConfig: GravatarConfig = {
  fallback: FALLBACK.mm,
  rating: RATING.g,
  backgroundColor: 'rgba(255, 255, 255, 1)',
  borderColor: 'rgba(255, 255, 255, 1)',
  hasBorder: true, // Set this flag to true to have a border by default
};

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxMasonryModule } from 'ngx-masonry';
import { OAuthModule, OAuthStorage } from 'angular-oauth2-oidc';

export function storageFactory() : OAuthStorage {
  return localStorage
}

@NgModule({
  imports: [
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    BsDatepickerModule.forRoot(),
    MarkdownModule.forRoot(),
    GravatarModule.forRoot(gravatarConfig),
    InfiniteScrollModule,
    NgSelectModule,
    NgxChartsModule,
    NgxMasonryModule,
    OAuthModule.forRoot()
  ],
  exports: [
    FormsModule,
    ReactiveFormsModule,
    FlexLayoutModule,
    TooltipModule,
    ModalModule,
    BsDatepickerModule,
    MarkdownModule,
    GravatarModule,
    InfiniteScrollModule,
    NgSelectModule,
    NgxChartsModule,
    NgxMasonryModule,
    OAuthModule
  ],
  providers: [
    { provide: OAuthStorage, useFactory: storageFactory }
  ]
})
export class VendorsModule {
}
