/*
 * GovCat - GovWay API Catalogue
 * Issue 270 — routing del selettore organizzazione post-login.
 */
import { Routes } from '@angular/router';

import { OrganizationSelectorComponent } from './organization-selector.component';

export const ORGANIZATION_SELECTOR_ROUTES: Routes = [
  {
    path: '',
    component: OrganizationSelectorComponent,
    data: { title: 'Selezione organizzazione' }
  }
];
