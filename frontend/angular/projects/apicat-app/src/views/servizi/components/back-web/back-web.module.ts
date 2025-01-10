import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';

import { BackWebComponent } from './back-web.component';

@NgModule({
  declarations: [
    BackWebComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    VendorsModule
  ],
  exports: [
    BackWebComponent
  ]
})
export class BackWebModule { }
