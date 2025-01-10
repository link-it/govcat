/* "Barrel" of Http Interceptors; see HttpClient docs and sample code for more info */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { DEFAULT_TIMEOUT, TimeoutInterceptor } from 'projects/tools/src/lib/interceptors/timeout.interceptor';
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
