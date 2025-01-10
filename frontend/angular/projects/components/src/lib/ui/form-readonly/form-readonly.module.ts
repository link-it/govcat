import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';

import { FormReadonlyComponent } from './form-readonly.component';

@NgModule({
  declarations: [
    FormReadonlyComponent
  ],
  imports: [
    CommonModule,
    TranslateModule
  ],
  exports: [
    FormReadonlyComponent
  ]
})
export class FormReadonlyModule { }
