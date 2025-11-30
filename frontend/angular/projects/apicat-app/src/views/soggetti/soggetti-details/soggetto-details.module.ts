import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { TrimOnBlurModule } from '@app/directives/trim-on-blur/trim-on-blur.module';

import { SoggettoDetailsComponent } from './soggetto-details.component';
import { SoggettoDetailsRoutingModule } from './soggetto-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    ComponentsModule,
    HasPermissionModule,
    MarkAsteriskModule,
    TrimOnBlurModule,
    SoggettoDetailsRoutingModule
  ],
  declarations: [
    SoggettoDetailsComponent
  ],
  exports: [SoggettoDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SoggettoDetailsModule { }
