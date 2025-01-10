import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { CollapseRowComponent } from './collapse-row.component';

import { ItemTypeModule } from '../item-type/item-type.module';

@NgModule({
  declarations: [
    CollapseRowComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    ItemTypeModule
  ],
  exports: [
    CollapseRowComponent
  ]
})
export class CollapseRowModule { }
