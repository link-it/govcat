import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { NotificationBarComponent } from './notification-bar.component';

@NgModule({
  declarations: [
    NotificationBarComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    NotificationBarComponent
  ]
})
export class NotificationBarModule { }
