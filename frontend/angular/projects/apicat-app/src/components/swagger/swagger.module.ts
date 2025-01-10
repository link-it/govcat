import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { SwaggerComponent } from './swagger.component';

@NgModule({
  declarations: [
    SwaggerComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    SwaggerComponent
  ]
})
export class SwaggerModule { }
