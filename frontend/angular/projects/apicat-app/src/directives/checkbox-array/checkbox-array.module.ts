import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckboxArrayKey, CheckboxArrayValueAccessor } from './checkbox-array.directive';

@NgModule({
  declarations: [
    CheckboxArrayKey,
    CheckboxArrayValueAccessor
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CheckboxArrayKey,
    CheckboxArrayValueAccessor
  ]
})
export class CheckboxArrayModule { }
