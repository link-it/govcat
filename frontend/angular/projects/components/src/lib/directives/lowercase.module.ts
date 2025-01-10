import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextLowercaseDirective } from './lowercase.directive';

@NgModule({
  declarations: [
    TextLowercaseDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TextLowercaseDirective
  ]
})
export class TextLowercaseModule { }
