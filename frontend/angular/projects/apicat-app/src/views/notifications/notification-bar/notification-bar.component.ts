import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from "@angular/core";
import { Router, ActivatedRoute } from '@angular/router';

import { TranslateService } from "@ngx-translate/core";

import { OpenAPIService } from '@app/services/openAPI.service';

import { NotificationState, NotificationType, NotificationEntityType } from '../notifications'

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

  NotificationState = NotificationState;

  constructor(
    private router: Router,
    private translate: TranslateService,
    public apiService: OpenAPIService,
  ) { }

  ngOnInit() { }
  
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
    // console.log('markNotification', stato);
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
    this.router.navigate(['/notifications']);
  }

  onClose() {
    this.close.emit({close: true});
  }
}
