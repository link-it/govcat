import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card.component';
// import { MatCheckboxModule } from '@angular/material/checkbox';

import { ItemTypeModule } from '../item-type/item-type.module';
import { DataTypeModule } from '../data-type/data-type.module';
import { SetBackgroundImageModule } from '../../directives/set-background-image.module';
import { HttpImgSrcPipeModule } from '../../pipes/http-img-src.module';

@NgModule({
  declarations: [
    CardComponent
  ],
  imports: [
    CommonModule,
    // MatCheckboxModule,
    ItemTypeModule,
    DataTypeModule,
    SetBackgroundImageModule,
    HttpImgSrcPipeModule
  ],
  exports: [
    CardComponent
  ]
})
export class CardModule { }
