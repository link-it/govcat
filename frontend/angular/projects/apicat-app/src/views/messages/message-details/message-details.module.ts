import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { MessageDetailsComponent } from './message-details.component';
import { MessageDetailsRoutingModule } from './message-details-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    MessageDetailsRoutingModule
  ],
  declarations: [
    MessageDetailsComponent
  ],
  exports: [MessageDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MessageDetailsModule { }
