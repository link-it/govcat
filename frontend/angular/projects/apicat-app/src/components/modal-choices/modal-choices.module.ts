import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

import { ModalChoicesComponent } from './modal-choices.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule
  ],
  exports: [ModalChoicesComponent],
  declarations: [ModalChoicesComponent]
})
export class ModalChoicesModule { }
