import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdesioneViewRoutingModule } from './adesione-view-routing.module';
import { AdesioneViewComponent } from './adesione-view.component';
import { ScrollModule } from '@app/components/scroll/scroll.module';
import { BreadcrumbModule } from 'projects/components/src/lib/ui/breadcrumb/breadcrumb.module';
import { ComponentsModule } from 'projects/components/src/public-api';
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
    BreadcrumbModule,
    ComponentsModule,
    GravatarModule,
    MonitorDropdwnModule
  ]
})
export class AdesioneViewModule { }
