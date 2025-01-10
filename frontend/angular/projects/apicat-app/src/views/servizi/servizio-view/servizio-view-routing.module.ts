import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ServizioViewComponent } from './servizio-view.component';

const routes: Routes = [
    {
        path: '',
        children: [
        {
            path: '',
            component: ServizioViewComponent
        }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class ServizioDetailsRoutingModule {}
