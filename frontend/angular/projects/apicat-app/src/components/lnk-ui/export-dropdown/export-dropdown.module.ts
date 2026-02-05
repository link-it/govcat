import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { ExportDropdwnComponent } from './export-dropdown.component';

@NgModule({
  declarations: [
    ExportDropdwnComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
  ],
  exports: [
    ExportDropdwnComponent
  ]
})
export class ExportDropdwnModule { }
