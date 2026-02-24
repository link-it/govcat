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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';

import { ConfigService } from '@linkit/components';

import { OpenAPIService } from '@app/services/openAPI.service';
import { AuthenticationService } from '@app/services/authentication.service';

import { NotificationState } from '../notifications'

@Component({
  selector: 'app-notification-bar',
  templateUrl: 'notification-bar.component.html',
  styleUrls: ['notification-bar.component.scss'],
  standalone: false
})
export class NotificationBarComponent implements OnInit, OnChanges {

  @Input() notification: any = null;
  @Input() notificationId: string | null = null;
  @Input() type: string = ''; // servizi - adesioni
  @Input() top: number = 0;

  @Output() close: EventEmitter<any> = new EventEmitter();

  _notification: any = null;
  _fromDashboard: boolean = false;

  NotificationState = NotificationState;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly configService: ConfigService,
    private readonly authenticationService: AuthenticationService,
    public apiService: OpenAPIService,
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      if (params['from'] === 'dashboard') {
        this._fromDashboard = true;
      }
    });

    // Gestore con notifiche nascoste dalla dashboard: torna sempre alla dashboard
    if (this.authenticationService.isGestore()) {
      const appConfig = this.configService.getConfiguration();
      const dashboardConfig = appConfig?.AppConfig?.Layout?.dashboard;
      if (dashboardConfig?.enabled && dashboardConfig?.hideNotificationMenu) {
        this._fromDashboard = true;
      }
    }
  }
  
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.notificationId.currentValue) {
      this.notificationId = changes.notificationId.currentValue;
      this.loadData();
    }
    if (changes.notification.currentValue) {
      this.notification = changes.notification.currentValue;
      this._notification = changes.notification.currentValue;
      if (this._notification.stato === NotificationState.Nuova) {
        this.markNotification(NotificationState.Letta);
      }
  }
  }

  loadData() {
    this._notification = null;
    this.apiService.getDetails('notifiche', this.notificationId).subscribe({
      next: (response: any) => {
        this._notification = response;
        if (this._notification.stato === NotificationState.Nuova) {
          this.markNotification(NotificationState.Letta);
        }
      },
      error: (error: any) => {
        console.log('erroe', error);
      }
    });
  }

  markNotification(stato: string, back: boolean = false) {
    const _body = {
      stato: stato
    }
    this.apiService.putElement('notifiche', this._notification.id_notifica, _body).subscribe({
      next: (response: any) => {
        this._notification = response;
        if (back) { this.onBack(); }
      },
      error: (error: any) => {
        console.log('markNotification errore', error);
      }
    });
  }

  _isUnread() {
    return (this._notification?.stato === NotificationState.Nuova);
  }

  onBack() {
    this.router.navigate([this._fromDashboard ? '/dashboard' : '/notifications']);
  }

  onClose() {
    this.close.emit({close: true});
  }
}
