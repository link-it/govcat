import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MessageDetailsComponent } from './message-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: MessageDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class MessageDetailsRoutingModule {}
