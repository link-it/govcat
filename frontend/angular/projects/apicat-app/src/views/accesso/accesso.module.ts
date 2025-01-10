import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { AccessoComponent } from './accesso.component';
import { AccessoRoutingModule } from './accesso-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    AccessoRoutingModule
  ],
  declarations: [
    AccessoComponent
  ],
  providers: []
})
export class AccessoModule { }
