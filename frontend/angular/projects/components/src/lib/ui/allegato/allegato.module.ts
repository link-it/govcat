import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { AllegatoComponent } from './allegato.component';

@NgModule({
  declarations: [
    AllegatoComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    AllegatoComponent
  ]
})
export class AllegatoModule { }
