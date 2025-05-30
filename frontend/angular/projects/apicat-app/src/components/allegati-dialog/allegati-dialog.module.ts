import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { AllegatiDialogComponent } from './allegati-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    MarkAsteriskModule
  ],
  declarations: [AllegatiDialogComponent]
})
export class AllegatiDialogModule { }
