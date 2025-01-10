import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppSwitcherComponent } from './app-switcher.component';

@NgModule({
  declarations: [
    AppSwitcherComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    AppSwitcherComponent
  ]
})
export class AppSwitcherModule { }
