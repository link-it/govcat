import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgxChartsModule } from '@swimlane/ngx-charts';

import { SparklineComponent } from './sparkline.component';

@NgModule({
  declarations: [
    SparklineComponent
  ],
  imports: [
    CommonModule,
    NgxChartsModule
  ],
  exports: [
    SparklineComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SparklineeModule { }
