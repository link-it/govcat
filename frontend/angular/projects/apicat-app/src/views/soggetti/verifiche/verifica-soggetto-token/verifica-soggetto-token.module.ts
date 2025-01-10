import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ComponentsModule } from 'projects/components/src/lib/components.module';

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
