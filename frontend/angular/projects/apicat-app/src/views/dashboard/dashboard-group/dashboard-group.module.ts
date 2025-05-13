import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
 import { RemoveHostModule } from '@app/directives/remove-host/remove-host.module';

import { DashboardGroupComponent } from './dashboard-group.component';
import { DashboardCardModule } from '../dashboard-card/dashboard-card.module';

@NgModule({
  declarations: [
    DashboardGroupComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
     RemoveHostModule,
    DashboardCardModule
  ],
  exports: [
    DashboardGroupComponent
  ]
})
export class DashboardGroupModule { }
