import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { BoxMessageComponent } from './box-message.component';

@NgModule({
  declarations: [
    BoxMessageComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    BoxMessageComponent
  ]
})
export class BoxMessageModule { }
