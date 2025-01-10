import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { VerificaApiComponent } from './verifica-api.component';

@NgModule({
  declarations: [
    VerificaApiComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    TooltipModule,
    ComponentsModule
  ],
  exports: [
    VerificaApiComponent
  ]
})
export class VerificaApiModule { }
