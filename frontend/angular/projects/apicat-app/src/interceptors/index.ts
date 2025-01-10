/* "Barrel" of Http Interceptors; see HttpClient docs and sample code for more info */
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { OAuthInterceptor } from './oauth.interceptor';

export const appHttpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: OAuthInterceptor, multi: true }
];
