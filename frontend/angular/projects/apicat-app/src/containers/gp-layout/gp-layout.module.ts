import { CommonModule } from '@angular/common';
import { NgModule} from '@angular/core';

import {
    BrandMinimizeDirective,
    MobileSidebarToggleDirective,
    SidebarMinimizeDirective,
    SidebarOffCanvasCloseDirective,
    HtmlAttributesDirective,
    FlyOutDirective
} from './gp-layout.directive';

import {} from './gp-layout.directive';

import { AboutDialogModule } from '../../components/about-dialog/about-dialog.module';

@NgModule({
    imports: [
        CommonModule,
        AboutDialogModule
    ],
    exports: [
        BrandMinimizeDirective,
        MobileSidebarToggleDirective,
        SidebarMinimizeDirective,
        SidebarOffCanvasCloseDirective,
        HtmlAttributesDirective,
        FlyOutDirective
    ],
    declarations: [
        BrandMinimizeDirective,
        MobileSidebarToggleDirective,
        SidebarMinimizeDirective,
        SidebarOffCanvasCloseDirective,
        HtmlAttributesDirective,
        FlyOutDirective
    ],
    providers: []
})
export class GpLayoutModule { }
