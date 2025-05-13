import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';

import { SelectionDropdownComponent } from './selection-dropdown.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    ComponentsModule
  ],
  declarations: [SelectionDropdownComponent],
  exports: [SelectionDropdownComponent]
})
export class SelectionDropdownModule { }
