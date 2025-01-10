import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';

import { InputHelpComponent } from './input-help.component';

@NgModule({
  declarations: [
    InputHelpComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    MarkdownModule
  ],
  exports: [
    InputHelpComponent
  ]
})
export class InputHelpModule { }
