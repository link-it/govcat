import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdesioneViewComponent } from './adesione-view.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: AdesioneViewComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdesioneViewRoutingModule { }
