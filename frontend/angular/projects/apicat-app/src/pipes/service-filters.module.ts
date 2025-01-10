import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthFilterPipe, DominiFilterListPipe, GroupFilterPipe, RisorseFilterPipe } from './service-filters';
import { PropertyFilterPipe, ServiceFilterPipe, ServiceGroupFilterPipe } from './service-filters';

@NgModule({
  declarations: [
    ServiceFilterPipe,
    ServiceGroupFilterPipe,
    DominiFilterListPipe,
    GroupFilterPipe,
    PropertyFilterPipe,
    RisorseFilterPipe,
    AuthFilterPipe,
    // VisibilitaAllegatiPerRuoloPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ServiceFilterPipe,
    ServiceGroupFilterPipe,
    DominiFilterListPipe,
    GroupFilterPipe,
    PropertyFilterPipe,
    RisorseFilterPipe,
    AuthFilterPipe,
    // VisibilitaAllegatiPerRuoloPipe
  ]
})
export class ServiceFiltersModule { }
