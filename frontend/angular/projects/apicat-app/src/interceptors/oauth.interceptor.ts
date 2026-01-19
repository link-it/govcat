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
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { Injectable, Optional } from '@angular/core';
import { Observable } from 'rxjs';

import { catchError } from 'rxjs/operators';

import { ConfigService } from '@linkit/components';

import { OAuthModuleConfig, OAuthResourceServerErrorHandler, OAuthStorage } from 'angular-oauth2-oidc';

@Injectable({
  providedIn: 'root'
})
export class OAuthInterceptor implements HttpInterceptor {

  config: any;

  constructor(
    private configService: ConfigService,
    private authStorage: OAuthStorage,
    private errorHandler: OAuthResourceServerErrorHandler,
    @Optional() private moduleConfig: OAuthModuleConfig
  ) {
    this.config = this.configService.getConfiguration();
  }

  private isPrivateRequest(req: HttpRequest<any>): boolean {
    if (req.url.indexOf(this.config?.AppConfig?.GOVAPI.HOST) !== -1) {
      return true;
    }
    return false;
  }

  public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const _urls = ['-config.json'];

    if (_urls.some(v => req.url.indexOf(v) !== -1) || this.config?.AppConfig?.AUTH_SETTINGS?.OAUTH.BackdoorSpid) {
      return next.handle(req);
    }

    // if (!this.isPrivateRequest(req)) {
    //   return next.handle(req);
    // }

    const token: string | null = this.authStorage.getItem('access_token');
    if (token) {
      const header = 'Bearer ' + token;
      let headers = req.headers;
      headers = headers.set('Authorization', header);
      req = req.clone({ headers });
    } else {
      return next.handle(req);
    }

    return next.handle(req).pipe(catchError(err => this.errorHandler.handleError(err)));
  }
}
