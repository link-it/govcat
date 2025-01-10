import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { DashboardComponent } from './dashboard.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardGroupModule } from './dashboard-group/dashboard-group.module';

import { VerificheModule } from '../servizi/verifiche/verifiche.module';
import { ClientVerificheModule } from '../clients/client-verifiche/client-verifiche.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    DashboardRoutingModule,
    DashboardGroupModule,
    VerificheModule,
    ClientVerificheModule
  ],
  declarations: [
    DashboardComponent
  ],
  providers: []
})
export class DashboardModule { }
