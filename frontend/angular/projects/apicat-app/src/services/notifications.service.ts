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
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, timer, Subscription, Subject, of } from 'rxjs';
import { switchMap, tap, share, retry, takeUntil, catchError } from 'rxjs/operators';

import { OpenAPIService } from '@services/openAPI.service';
import { UtilService } from '@app/services/utils.service';
import { ConfigService } from '@linkit/components';

export interface NotificationsCount {
  count: number;
}

@Injectable()
export class NotificationsService implements OnDestroy {

  private allNotifications$: Observable<NotificationsCount>;

  private stopPolling = new Subject();

  private _lastCount: number = 0;

  constructor(
    private apiService: OpenAPIService,
    private utilService: UtilService,
    private configService: ConfigService
  ) {
    const _notificationsTimer = this.configService.getConfiguration().AppConfig.DEFAULT_NOTIFICATIONS_TIMER;
    let aux: any = { params: this.utilService._queryToHttpParams({ stato_notifica: 'nuova' }) };
    this.allNotifications$ = timer(1, _notificationsTimer).pipe(
      switchMap(() => this.apiService.getDetails('notifiche', 'count', '', aux)),
      retry(3),
      catchError(() => of({count: -1})),
      // tap(console.log),
      share(),
      takeUntil(this.stopPolling)
    );
  }

  getNotificationsCount(): Observable<NotificationsCount> {
    return this.allNotifications$.pipe(
      tap((val) => this._lastCount = val.count)
    );
  }

  ngOnDestroy() {
      this.stopPolling.next(null);
  }

  getCurrentCount() {
    return this._lastCount;
  }
}
