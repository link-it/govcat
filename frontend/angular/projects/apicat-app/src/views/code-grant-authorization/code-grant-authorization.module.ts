import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';

import { CodeGrantAuthorizationComponent } from './code-grant-authorization.component';
import { CodeGrantAuthorizationRoutingModule } from './code-grant-authorization-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    CodeGrantAuthorizationRoutingModule
  ],
  declarations: [
    CodeGrantAuthorizationComponent
  ],
  providers: []
})
export class CodeGrantAuthorizationModule { }
