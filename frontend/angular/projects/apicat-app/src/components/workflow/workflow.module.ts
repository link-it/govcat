import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';

import { WorkflowComponent } from './workflow.component';

@NgModule({
  declarations: [
    WorkflowComponent
  ],
  imports: [
    CommonModule,
    TooltipModule,
    TranslateModule,
    ComponentsModule
  ],
  exports: [
    WorkflowComponent
  ]
})
export class WorkflowModule { }
