import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';

import { TassonomiaTokenComponent } from './tassonomia-token.component';

@NgModule({
  declarations: [
    TassonomiaTokenComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
    ComponentsModule
  ],
  exports: [
    TassonomiaTokenComponent
  ]
})
export class TassonomiaTokenModule { }
