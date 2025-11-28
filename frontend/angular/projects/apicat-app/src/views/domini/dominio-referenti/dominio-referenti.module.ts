import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { DominioReferentiComponent } from './dominio-referenti.component';
import { DominioReferentiRoutingModule } from './dominio-referenti-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    MarkAsteriskModule,
    DominioReferentiRoutingModule
  ],
  declarations: [
    DominioReferentiComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DominioReferentiModule { }
