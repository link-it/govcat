import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TooltipModule } from 'ngx-bootstrap/tooltip';

import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '@linkit/components';

import { TreeViewComponent } from './tree-view.component';

@NgModule({
    declarations: [
        TreeViewComponent
    ],
    imports: [
        CommonModule,
        TooltipModule,
        TranslateModule,
        ComponentsModule
    ],
    exports: [
        TreeViewComponent
    ]
})
export class TreeViewModule { }

// https://stackoverflow.com/questions/61905207/angular-8-implementing-a-hierarchical-list-recursively-with-dynamic-expansion
