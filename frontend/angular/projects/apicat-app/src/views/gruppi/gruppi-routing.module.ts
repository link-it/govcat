import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { GruppiComponent } from './gruppi.component';
// import { GruppoDetailsComponent } from './gruppo-details/gruppo-details.component';

const routes: Routes = [
{
    path: '',
    children: [
        {
            path: '',
            data: { breadcrumb: 'Gruppi' },
            component: GruppiComponent
        },
        // {
        //     path: ':id',
        //     data: { breadcrumb: ':id' },
        //     component: GruppoDetailsComponent
        // }
    ]
}
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class GruppiRoutingModule {}
