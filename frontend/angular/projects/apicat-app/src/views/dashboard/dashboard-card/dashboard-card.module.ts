import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';
 
import { DashboardCardComponent } from './dashboard-card.component';

@NgModule({
  declarations: [
    DashboardCardComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    ComponentsModule,
       ],
  exports: [
    DashboardCardComponent
  ]
})
export class DashboardCardModule { }
