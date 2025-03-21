import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'projects/components/src/lib/components.module';

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
