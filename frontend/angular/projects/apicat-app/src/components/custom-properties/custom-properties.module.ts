import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { CustomPropertiesComponent } from './custom-properties.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TooltipModule,
        TranslateModule,
        ComponentsModule,
        MarkAsteriskModule
    ],
    declarations: [CustomPropertiesComponent],
    exports: [CustomPropertiesComponent]
})
export class CustomPropertiesModule { }
