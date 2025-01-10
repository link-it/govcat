import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CodeGrantAuthorizationComponent } from './code-grant-authorization.component';

const routes: Routes = [
    {
        path: '',
        component: CodeGrantAuthorizationComponent,
        data: {
            title: 'Code Grant Authorization'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class CodeGrantAuthorizationRoutingModule {}
