import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaxonomiesComponent } from './taxonomies.component';
import { TaxonomyDetailsComponent } from './taxonomy-details/taxonomy-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Tassonomie' },
        component: TaxonomiesComponent
      },
      {
        path: ':id',
        data: { breadcrumb: ':id' },
        component: TaxonomyDetailsComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TaxonomiesRoutingModule {}
