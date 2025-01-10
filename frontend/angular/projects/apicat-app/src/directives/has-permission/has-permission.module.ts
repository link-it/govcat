import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HasPermissionDirective } from './has-permission.directive';

@NgModule({
  declarations: [
    HasPermissionDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    HasPermissionDirective
  ]
})
export class HasPermissionModule { }
