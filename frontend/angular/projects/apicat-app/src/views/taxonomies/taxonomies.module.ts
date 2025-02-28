import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { TaxonomiesComponent } from './taxonomies.component';
import { TaxonomiesRoutingModule } from './taxonomies-routing.module';
import { TaxonomyDetailsModule } from './taxonomy-details/taxonomy-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    TaxonomiesRoutingModule,
    TaxonomyDetailsModule
  ],
  declarations: [
    TaxonomiesComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaxonomiesModule { }
