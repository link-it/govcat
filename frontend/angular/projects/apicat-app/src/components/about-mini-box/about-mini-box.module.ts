import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ComponentsModule } from 'projects/components/src/lib/components.module';

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
