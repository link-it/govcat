import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

import { VendorsModule } from 'projects/vendors/src/lib/vendors.module';
import { ComponentsModule } from 'projects/components/src/lib/components.module';
import { AppComponentsModule } from "@app/components/components.module";
import { MarkAsteriskModule } from '@app/directives/mark-asterisk/mark-asterisk.module';

import { AgidJwtSignatureTrackingEvidenceDialogComponent } from './agid-jwt-signature-tracking-evidence-dialog.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    VendorsModule,
    ComponentsModule,
    AppComponentsModule,
    MarkAsteriskModule
  ],
  exports: [AgidJwtSignatureTrackingEvidenceDialogComponent],
  declarations: [AgidJwtSignatureTrackingEvidenceDialogComponent]
})
export class AgidJwtSignatureTrackingEvidenceDialogModule { }
