import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpContextToken } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { TranslateService } from '@ngx-translate/core';

import { Tools } from '../services/tools.service';
import { PageloaderService } from '../services/pageloader.service';
import { ConfigService } from '../services/config.service';

export const DISABLE_GLOBAL_EXCEPTION_HANDLING = new HttpContextToken<boolean>(() => false);


@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private translate: TranslateService,
    private pageloaderService: PageloaderService,
    private configService: ConfigService

  ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.ignoreErrorHandling(request)) {
      return next.handle(request);
    }
    
    return next.handle(request).pipe(catchError(err => {
      if ([401].indexOf(err.status) !== -1) {
        Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));
        
        if(this.configService.getConfiguration().AppConfig.STANDALONE == true){
          setTimeout(() => {
            this.router.navigate(['/auth/login']);
          }, 500);

        }else{
          window.parent.postMessage({
            from: 'GovApp',
            action: 'logout',
            message: 'APP.MESSAGE.ERROR.Unauthorized'
          }, '*');
        }
      }

      if ([403].indexOf(err.status) !== -1) {
        Tools.OnError(err, this.translate.instant('APP.MESSAGE.ERROR.Unauthorized'));
      }

      if ([400, 422].indexOf(err.status) !== -1) {
        // console.log('logout', err.status, err);
      }

      this.pageloaderService.hideLoader();

      const error = { message: err.message || err.statusText, error: err.error };
      return throwError(error);
    }));
  }

  private ignoreErrorHandling(request: HttpRequest<any>) {
    return request.context.get(DISABLE_GLOBAL_EXCEPTION_HANDLING);
  }
}
