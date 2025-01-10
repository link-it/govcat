import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextUppercaseDirective } from './uppercase.directive';

@NgModule({
  declarations: [
    TextUppercaseDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TextUppercaseDirective
  ]
})
export class TextUppercaseModule { }
