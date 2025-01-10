import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { TreeViewCategoryModule } from '@app/components/tree-view-category/tree-view-category.module';

import { ModalCategoryChoiceComponent } from './modal-category-choice.component';
import { CategoriesModule } from '../../views/taxonomies/components/categories/categories.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    TreeViewCategoryModule,
    CategoriesModule
  ],
  exports: [ModalCategoryChoiceComponent],
  declarations: [ModalCategoryChoiceComponent]
})
export class ModalCategoryChoiceModule { }
