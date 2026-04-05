/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { BsDatepickerModule } from 'ngx-bootstrap/datepicker';
import { TranslateModule } from '@ngx-translate/core';
import { GravatarModule } from 'ngx-gravatar';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NgSelectModule } from '@ng-select/ng-select';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { NgxMasonryModule } from 'ngx-masonry';

import { HeadBarComponent } from './head-bar/head-bar.component';
import { SpinnerComponent } from './spinner/spinner.component';
import { directives } from './directives';
import { ui } from './ui';
import { pipes } from './pipes';
import { dialogs } from './dialogs';

export const COMPONENTS_IMPORTS = [
  FormsModule,
  ReactiveFormsModule,
  TranslateModule,
  TooltipModule,
  ModalModule,
  BsDatepickerModule,
  GravatarModule,
  InfiniteScrollDirective,
  NgSelectModule,
  NgxChartsModule,
  NgxMasonryModule,
  HeadBarComponent,
  SpinnerComponent,
  ...ui,
  ...dialogs,
  ...pipes,
  ...directives
] as const;

export { HeadBarComponent, SpinnerComponent };

export * from './charts/sparkline/sparkline.component';

export * from './directives';
export * from './ui';
export * from './pipes';
export * from './dialogs';
export * from './services';
export * from './interceptors';
export * from './classes';
export * from './ui/classes';
