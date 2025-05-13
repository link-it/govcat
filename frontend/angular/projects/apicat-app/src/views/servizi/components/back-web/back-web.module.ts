import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
 
import { BackWebComponent } from './back-web.component';

@NgModule({
  declarations: [
    BackWebComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
       ],
  exports: [
    BackWebComponent
  ]
})
export class BackWebModule { }
