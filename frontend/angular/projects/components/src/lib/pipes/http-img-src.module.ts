import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { HttpImgSrcPipe } from './http-img-src.pipe';

@NgModule({
    declarations: [
        HttpImgSrcPipe
    ],
    imports: [
        CommonModule
    ],
    exports: [
        HttpImgSrcPipe
    ]
})
export class HttpImgSrcPipeModule { }
