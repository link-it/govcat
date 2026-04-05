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
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';

export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {
  constructor(@Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timeoutValue = req.headers.get('timeout') || this.defaultTimeout;
    const timeoutValueNumeric = Number(timeoutValue);

    if (req.headers.has('timeout')) {
      req = req.clone({ headers: req.headers.delete('timeout') });
    }

    return next.handle(req).pipe(timeout(timeoutValueNumeric));
  }
}
