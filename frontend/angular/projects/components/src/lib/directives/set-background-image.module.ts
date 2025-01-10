import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SetBackgroundImageDirective } from './set-background-image.directive';

@NgModule({
  declarations: [
    SetBackgroundImageDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SetBackgroundImageDirective
  ]
})
export class SetBackgroundImageModule { }
