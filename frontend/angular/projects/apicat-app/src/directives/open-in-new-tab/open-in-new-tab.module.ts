import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OpenInNewTabDirective } from './open-in-new-tab.directive';

@NgModule({
    declarations: [
        OpenInNewTabDirective
    ],
    imports: [
        CommonModule
    ],
    exports: [
        OpenInNewTabDirective
    ]
})
export class OpenInNewTabModule { }
