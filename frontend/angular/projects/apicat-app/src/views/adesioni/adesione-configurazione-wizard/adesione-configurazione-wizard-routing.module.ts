import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdesioneConfigurazioneWizardComponent } from './adesione-configurazione-wizard.component';

const routes: Routes = [
    {
        path: '',
        children: [
            {
                path: '',
                component: AdesioneConfigurazioneWizardComponent
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdesioneConfigurazioneWizardRoutingModule { }
