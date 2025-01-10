import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaxonomyDetailsComponent } from './taxonomy-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: TaxonomyDetailsComponent
      },
      {
        path: ':id/categorie',
        data: { breadcrumb: 'Categorie' },
        loadChildren: () => import('../taxonomy-categories/taxonomy-categories.module').then(m => m.TaxonomyCategoriesModule)
      },
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TaxonomyDetailsRoutingModule {}
