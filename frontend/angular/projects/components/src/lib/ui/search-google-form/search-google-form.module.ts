import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { TokenSegmentModule } from './token-segment/token-segment.module';
import { SearchGoogleFormComponent } from './search-google-form.component';

@NgModule({
  declarations: [
    SearchGoogleFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    TokenSegmentModule
  ],
  exports: [
    SearchGoogleFormComponent
  ]
})
export class SearchGoogleFormModule { }
