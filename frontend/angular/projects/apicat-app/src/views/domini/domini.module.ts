import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
// import { AppComponentsModule } from '@app/components/components.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { DominiRoutingModule } from './domini-routing.module';
import { DominiComponent } from './domini.component';
import { DominioDetailsModule } from './dominio-details/dominio-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    // AppComponentsModule,
    HasPermissionModule,
    DominiRoutingModule,
    DominioDetailsModule
  ],
  declarations: [
    DominiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DominiModule { }
