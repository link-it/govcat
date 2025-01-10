import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CountUpDirective } from './count-up.directive';

@NgModule({
  declarations: [
    CountUpDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CountUpDirective
  ]
})
export class CountUpeModule { }
