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

/* "Barrel" of Http Interceptors; see HttpClient docs and sample code for more info */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { DEFAULT_TIMEOUT, TimeoutInterceptor } from './timeout.interceptor';
import { ErrorInterceptor } from './error.interceptor';
import { LoaderInterceptor } from './loader.interceptor';
import { CSRFInterceptor } from './csrf.interceptor';
// import { AuthDevInterceptor } from './authdev.interceptor';

/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  [{ provide: DEFAULT_TIMEOUT, useValue: 30000 }],
  [{ provide: HTTP_INTERCEPTORS, useClass: TimeoutInterceptor, multi: true }],
  { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: CSRFInterceptor, multi: true },
  // { provide: HTTP_INTERCEPTORS, useClass: AuthDevInterceptor, multi: true }
];
