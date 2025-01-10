import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { PlaceholderLoadingComponent } from './placeholder-loading.component';

@NgModule({
  declarations: [
    PlaceholderLoadingComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ],
  exports: [
    PlaceholderLoadingComponent
  ]
})
export class PlaceholderLoadingModule { }
