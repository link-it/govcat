import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { RepeaterComponent } from './repeater.component';

@NgModule({
  declarations: [
    RepeaterComponent,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    RepeaterComponent
  ]
})
export class RepeaterModule { }
