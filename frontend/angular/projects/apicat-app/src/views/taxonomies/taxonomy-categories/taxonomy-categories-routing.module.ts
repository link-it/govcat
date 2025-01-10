import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TaxonomyCategoriesComponent } from './taxonomy-categories.component';
// import { GruppoDetailsComponent } from './gruppo-details/gruppo-details.component';

const routes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        data: { breadcrumb: 'Taxonomy Categories' },
        component: TaxonomyCategoriesComponent
      }
    ]
  }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class TaxonomyCategoriesRoutingModule {}
