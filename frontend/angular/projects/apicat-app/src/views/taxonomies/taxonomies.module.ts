import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

 import { ComponentsModule } from '@linkit/components';
import { HasPermissionModule } from '@app/directives/has-permission/has-permission.module';

import { TaxonomiesComponent } from './taxonomies.component';
import { TaxonomiesRoutingModule } from './taxonomies-routing.module';
import { TaxonomyDetailsModule } from './taxonomy-details/taxonomy-details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
     ComponentsModule,
    HasPermissionModule,
    TaxonomiesRoutingModule,
    TaxonomyDetailsModule
  ],
  declarations: [
    TaxonomiesComponent
  ],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TaxonomiesModule { }
