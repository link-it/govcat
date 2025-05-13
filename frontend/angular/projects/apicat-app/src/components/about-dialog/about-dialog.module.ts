import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { ComponentsModule } from '@linkit/components';

import { AboutDialogComponent } from './about-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule
  ],
  exports: [AboutDialogComponent],
  declarations: [AboutDialogComponent]
})
export class AboutDialogModule { }
