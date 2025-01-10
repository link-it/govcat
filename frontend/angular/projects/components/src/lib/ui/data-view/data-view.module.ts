import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { DataTypeModule } from '../data-type/data-type.module';
import { DataViewComponent } from './data-view.component';
import { DataCollapseModule } from './data-collapse/data-collapse.module';

@NgModule({
  declarations: [
    DataViewComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    DataTypeModule,
    DataCollapseModule
  ],
  exports: [
    DataViewComponent
  ]
})
export class DataViewModule { }
