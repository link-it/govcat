import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NewsBoxComponent } from './news-box.component';

@NgModule({
  imports: [
    CommonModule
  ],
  exports: [NewsBoxComponent],
  declarations: [NewsBoxComponent]
})
export class NewsBoxModule { }
