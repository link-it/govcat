import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PdndComponent } from './pdnd.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'PDND' },
        component: PdndComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class PdndRoutingModule {}
