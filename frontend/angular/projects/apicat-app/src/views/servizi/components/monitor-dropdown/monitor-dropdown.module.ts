import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { MonitorDropdwnComponent } from './monitor-dropdown.component';

@NgModule({
  declarations: [
    MonitorDropdwnComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
  ],
  exports: [
    MonitorDropdwnComponent
  ]
})
export class MonitorDropdwnModule { }
