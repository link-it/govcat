import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { SearchBarFormComponent } from './search-bar-form.component';

@NgModule({
  declarations: [
    SearchBarFormComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule
  ],
  exports: [
    SearchBarFormComponent
  ]
})
export class SearchBarFormModule { }
