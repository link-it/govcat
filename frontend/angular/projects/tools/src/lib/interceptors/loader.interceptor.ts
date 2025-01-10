import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { PageloaderService } from '../pageloader.service';

@Injectable()
export class LoaderInterceptor implements HttpInterceptor {

  constructor(private pageloaderService: PageloaderService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(map(event => {
      if (event instanceof HttpResponse) {
        this.pageloaderService.hideLoader();
      } else {
        this.pageloaderService.showLoader();
      }

      return event;
    }));
  }
}
