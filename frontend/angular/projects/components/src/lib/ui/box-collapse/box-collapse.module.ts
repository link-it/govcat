import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { BoxCollapseComponent } from './box-collapse.component';

@NgModule({
  declarations: [
    BoxCollapseComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MarkdownModule
  ],
  exports: [
    BoxCollapseComponent
  ]
})
export class BoxCollapseModule { }
