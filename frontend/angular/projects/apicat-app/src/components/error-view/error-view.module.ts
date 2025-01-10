import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { ErrorViewComponent } from './error-view.component';

@NgModule({
  declarations: [
    ErrorViewComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    ErrorViewComponent
  ]
})
export class ErrorViewModule { }
