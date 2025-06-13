import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdesioneViewRoutingModule } from './adesione-view-routing.module';
import { AdesioneViewComponent } from './adesione-view.component';
import { ScrollModule } from '@app/components/scroll/scroll.module';
import { ComponentsModule } from '@linkit/components';
import { TranslateModule } from '@ngx-translate/core';
import { GravatarModule } from 'ngx-gravatar';
import { MonitorDropdwnModule } from '@app/views/servizi/components/monitor-dropdown/monitor-dropdown.module';


@NgModule({
  declarations: [
    AdesioneViewComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,
    AdesioneViewRoutingModule,
    ScrollModule,
    ComponentsModule,
    GravatarModule,
    MonitorDropdwnModule
  ]
})
export class AdesioneViewModule { }
