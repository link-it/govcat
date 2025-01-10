import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { DataCollapseComponent } from './data-collapse.component';

@NgModule({
  declarations: [
    DataCollapseComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MarkdownModule
  ],
  exports: [
    DataCollapseComponent
  ]
})
export class DataCollapseModule { }
