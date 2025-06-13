import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { ClientAdesioniComponent } from './client-adesioni.component';
import { ClientAdesioniRoutingModule } from './client-adesioni-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    ClientAdesioniRoutingModule
  ],
  declarations: [
    ClientAdesioniComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ClientAdesioniModule { }
