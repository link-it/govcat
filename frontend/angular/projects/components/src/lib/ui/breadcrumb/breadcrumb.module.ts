import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { BreadcrumbService } from './breadcrumb.service';
import { BreadcrumbComponent } from './breadcrumb.component';

@NgModule({
  declarations: [
    BreadcrumbComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    BreadcrumbComponent
  ],
  providers: [
    BreadcrumbService
  ]
})
export class BreadcrumbModule { }
