import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { MapperPipe } from './token-segment.component';
import { TokenSegmentComponent } from './token-segment.component';

@NgModule({
  declarations: [
    MapperPipe,
    TokenSegmentComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ],
  exports: [
    TokenSegmentComponent
  ]
})
export class TokenSegmentModule { }
