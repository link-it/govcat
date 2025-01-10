import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MarkAsteriskDirective } from './mark-asterisk.directive';

@NgModule({
  declarations: [
    MarkAsteriskDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MarkAsteriskDirective
  ]
})
export class MarkAsteriskModule { }
