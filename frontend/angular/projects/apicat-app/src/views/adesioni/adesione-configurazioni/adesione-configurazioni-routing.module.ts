import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdesioneConfigurazioniComponent } from './adesione-configurazioni.component';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                component: AdesioneConfigurazioniComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneConfigurazioniRoutingModule {}
