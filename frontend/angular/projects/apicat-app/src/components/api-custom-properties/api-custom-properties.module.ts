import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiCustomPropertiesComponent } from './api-custom-properties.component';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';

import { CustomPropertiesModule } from '../custom-properties/custom-properties.module';

@NgModule({
    imports: [
        CommonModule,
        TooltipModule,
        TranslateModule,
        ComponentsModule,
        CustomPropertiesModule
    ],
    declarations: [ApiCustomPropertiesComponent],
    exports: [ApiCustomPropertiesComponent]
})
export class ApiCustomPropertiesModule { }
