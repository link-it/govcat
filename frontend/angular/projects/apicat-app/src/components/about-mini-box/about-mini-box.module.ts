import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComponentsModule } from '@linkit/components';

import { AboutMiniBoxComponent } from './about-mini-box.component';

@NgModule({
  imports: [
    CommonModule,
    ComponentsModule
  ],
  exports: [AboutMiniBoxComponent],
  declarations: [AboutMiniBoxComponent]
})
export class AboutMiniBoxModule { }
