import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ComponentsModule } from '@linkit/components';

import { VerificaSoggettoTokenComponent } from './verifica-soggetto-token.component';

@NgModule({
  declarations: [
    VerificaSoggettoTokenComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
    ComponentsModule
  ],
  exports: [
    VerificaSoggettoTokenComponent
  ]
})
export class VerificaSoggettoTokenModule { }
