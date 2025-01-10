import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RemoveHostDirective } from './remove-host.directive';

@NgModule({
  declarations: [
    RemoveHostDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    RemoveHostDirective
  ]
})
export class RemoveHostModule { }
