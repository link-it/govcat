import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLinkMatchDirective } from './router-link-match.directive';

@NgModule({
  declarations: [
    RouterLinkMatchDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    RouterLinkMatchDirective
  ]
})
export class RouterLinkMatchModule { }
