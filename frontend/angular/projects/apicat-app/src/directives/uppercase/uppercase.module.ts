import {NgModule} from '@angular/core';
import {UppercaseDirective} from './uppercase.directive';

@NgModule({
    declarations: [UppercaseDirective],
    exports: [UppercaseDirective]
})
export class UppercaseModule {
}
