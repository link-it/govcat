import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { PhotoBase64Component } from './photo-base64.component';

@NgModule({
  declarations: [
    PhotoBase64Component
  ],
  imports: [
    CommonModule
  ],
  exports: [
    PhotoBase64Component
  ]
})
export class PhotoBase64Module { }
