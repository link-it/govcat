import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProgressModule } from '../progress/progress.module';

import { FileUploadComponent } from './file-upload.component';

@NgModule({
  declarations: [
    FileUploadComponent
  ],
  imports: [
    CommonModule,
    ProgressModule
  ],
  exports: [
    FileUploadComponent
  ]
})
export class FileUploadModule { }
