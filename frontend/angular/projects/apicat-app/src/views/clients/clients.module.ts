import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { ClientsRoutingModule } from './clients-routing.module';
import { ClientsComponent } from './clients.component';
import { ClientDetailsModule } from './client-details/client-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    HasPermissionModule,
    ClientsRoutingModule,
    ClientDetailsModule
  ],
  declarations: [
    ClientsComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientsModule { }
