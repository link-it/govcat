import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { TreeViewCategoryModule } from '@app/components/tree-view-category/tree-view-category.module';

import { TaxonomyDetailsComponent } from './taxonomy-details.component';
import { TaxonomyDetailsRoutingModule } from './taxonomy-details-routing.module';
import { TaxonomyCategoriesModule } from '../taxonomy-categories/taxonomy-categories.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    HasPermissionModule,
    TaxonomyDetailsRoutingModule,
    TaxonomyCategoriesModule,
    MarkAsteriskModule,
    TreeViewCategoryModule
  ],
  declarations: [
    TaxonomyDetailsComponent
  ],
  exports: [TaxonomyDetailsComponent],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaxonomyDetailsModule { }
