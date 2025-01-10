import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';

import { UIDropdwnButtonComponent } from './dropdown-button.component';

@NgModule({
  declarations: [
    UIDropdwnButtonComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    VendorsModule
  ],
  exports: [
    UIDropdwnButtonComponent
  ]
})
export class UIDropdwnButtonModule { }
