import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthDevInterceptor implements HttpInterceptor {

  appConfig: any = null;
  authDevelop: boolean = false;

  constructor() {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const headerName = 'govhub-consumer-principal';
    req = req.clone({ headers: req.headers.set(headerName, 'gestore') });
    return next.handle(req);
  }
}
