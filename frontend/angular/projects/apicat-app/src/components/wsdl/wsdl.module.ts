import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { WsdlComponent } from './wsdl.component';

@NgModule({
  declarations: [
    WsdlComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    WsdlComponent
  ]
})
export class WsdlModule { }
