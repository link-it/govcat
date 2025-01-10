import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AccessoComponent } from './accesso.component';

const routes: Routes = [
    {
        path: '',
        component: AccessoComponent,
        data: {
            title: 'Accesso'
        }
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AccessoRoutingModule {}
