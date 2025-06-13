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
