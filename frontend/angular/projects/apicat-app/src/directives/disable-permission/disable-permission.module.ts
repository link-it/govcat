import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisablePermissionDirective } from './disable-permission.directive';

@NgModule({
  declarations: [
    DisablePermissionDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    DisablePermissionDirective
  ]
})
export class DisablePermissionModule { }
