import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { ItemTypeModule } from '../item-type/item-type.module';
import { ItemRowComponent } from './item-row.component';

@NgModule({
  declarations: [
    ItemRowComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    ItemTypeModule
  ],
  exports: [
    ItemRowComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ItemRowModule { }
