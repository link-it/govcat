import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';

import { MonitorDropdwnComponent } from './monitor-dropdown.component';

@NgModule({
  declarations: [
    MonitorDropdwnComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    VendorsModule
  ],
  exports: [
    MonitorDropdwnComponent
  ]
})
export class MonitorDropdwnModule { }
