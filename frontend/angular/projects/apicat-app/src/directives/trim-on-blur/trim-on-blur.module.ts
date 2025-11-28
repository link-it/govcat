import { NgModule } from '@angular/core';
import { TrimOnBlurDirective } from './trim-on-blur.directive';

@NgModule({
  declarations: [TrimOnBlurDirective],
  exports: [TrimOnBlurDirective]
})
export class TrimOnBlurModule {}
