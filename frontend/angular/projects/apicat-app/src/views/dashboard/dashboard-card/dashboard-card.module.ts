import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';

import { DashboardCardComponent } from './dashboard-card.component';

@NgModule({
  declarations: [
    DashboardCardComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ComponentsModule,
    VendorsModule
  ],
  exports: [
    DashboardCardComponent
  ]
})
export class DashboardCardModule { }
