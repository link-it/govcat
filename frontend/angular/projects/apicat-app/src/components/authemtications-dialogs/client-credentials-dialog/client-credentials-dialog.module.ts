import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { AppComponentsModule } from "@app/components/components.module";
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { ClientCredentialsDialogComponent } from './client-credentials-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    ComponentsModule,
    AppComponentsModule,
    MarkAsteriskModule
  ],
  exports: [ClientCredentialsDialogComponent],
  declarations: [ClientCredentialsDialogComponent]
})
export class ClientCredentialsDialogModule { }
