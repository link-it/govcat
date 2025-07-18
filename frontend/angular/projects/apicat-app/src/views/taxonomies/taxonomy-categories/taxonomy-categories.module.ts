import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';
import { TreeViewCategoryModule } from '@app/components/tree-view-category/tree-view-category.module';

import { TaxonomyCategoriesRoutingModule } from './taxonomy-categories-routing.module';
import { TaxonomyCategoriesComponent } from './taxonomy-categories.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule,
    TreeViewCategoryModule,
    TaxonomyCategoriesRoutingModule
  ],
  declarations: [
    TaxonomyCategoriesComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaxonomyCategoriesModule { }
