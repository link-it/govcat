import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HtmlAttributesDirective } from './html-attr.directive';

@NgModule({
  declarations: [
    HtmlAttributesDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HtmlAttributesDirective
  ]
})
export class HtmlAttributesModule { }
