import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { MarkdownModule } from 'ngx-markdown';
import { GravatarModule } from 'ngx-gravatar';

import { DataTypeComponent } from './data-type.component';

@NgModule({
  declarations: [
    DataTypeComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
    MarkdownModule,
    GravatarModule
  ],
  exports: [
    DataTypeComponent
  ]
})
export class DataTypeModule { }
