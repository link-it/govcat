import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';

import { AddEditValueComponent } from './add-edit-value.component';

@NgModule({
  declarations: [
    AddEditValueComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    TooltipModule,
    TranslateModule
  ],
  exports: [
    AddEditValueComponent
  ]
})
export class AddEditValueModule { }
