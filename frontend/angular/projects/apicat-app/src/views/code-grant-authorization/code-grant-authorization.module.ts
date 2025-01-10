import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { CodeGrantAuthorizationComponent } from './code-grant-authorization.component';
import { CodeGrantAuthorizationRoutingModule } from './code-grant-authorization-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    CodeGrantAuthorizationRoutingModule
  ],
  declarations: [
    CodeGrantAuthorizationComponent
  ],
  providers: []
})
export class CodeGrantAuthorizationModule { }
