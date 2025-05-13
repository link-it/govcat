import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';

import { AccessoComponent } from './accesso.component';
import { AccessoRoutingModule } from './accesso-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    AccessoRoutingModule
  ],
  declarations: [
    AccessoComponent
  ],
  providers: []
})
export class AccessoModule { }
