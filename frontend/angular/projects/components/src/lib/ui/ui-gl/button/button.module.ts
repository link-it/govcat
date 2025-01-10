import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { UIButtonComponent } from './button.component';

@NgModule({
  declarations: [
    UIButtonComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule
  ],
  exports: [
    UIButtonComponent
  ]
})
export class UIButtonModule { }
