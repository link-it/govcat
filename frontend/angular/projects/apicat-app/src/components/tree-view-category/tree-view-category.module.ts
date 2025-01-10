import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { TranslateModule } from '@ngx-translate/core';

import { TreeViewCategoryComponent } from './tree-view-category.component';

@NgModule({
  declarations: [
    TreeViewCategoryComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
    ComponentsModule
  ],
  exports: [
    TreeViewCategoryComponent
  ]
})
export class TreeViewCategoryModule { }

// https://stackoverflow.com/questions/61905207/angular-8-implementing-a-hierarchical-list-recursively-with-dynamic-expansion
