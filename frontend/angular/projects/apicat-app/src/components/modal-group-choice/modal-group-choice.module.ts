import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { TreeViewModule } from '@app/components/tree-view/tree-view.module';

import { ModalGroupChoiceComponent } from './modal-group-choice.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    TreeViewModule
  ],
  exports: [ModalGroupChoiceComponent],
  declarations: [ModalGroupChoiceComponent]
})
export class ModalGroupChoiceModule { }
