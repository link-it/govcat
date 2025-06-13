import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges, TemplateRef, ViewChild } from '@angular/core';

import { AuthenticationService } from '../../../services/authentication.service';
import { EventsManagerService } from '@linkit/components'

import { AmbienteEnum } from '../../../model/ambienteEnum';

@Component({
  selector: 'app-dashboard-card',
  templateUrl: './dashboard-card.component.html',
  styleUrls: ['./dashboard-card.component.scss'],
  standalone: false
})
export class DashboardCardComponent implements OnInit, OnChanges {
  @ViewChild('childComponentTemplate') childComponentTemplate!: TemplateRef<any>;

  @Input() environmentId: AmbienteEnum = AmbienteEnum.Collaudo;
  @Input() section: any = null;
  @Input() spin: boolean = true;
  @Input() period1: any = {};
  @Input() period2: any = {};
  @Input() reduced: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();

  showDebug: boolean = false;

  _minutesPeriodo1: number = 0;
  _minutesPeriodo2: number = 0;

  constructor(
    private authenticationService: AuthenticationService,
    private eventsManagerService: EventsManagerService
  ) {
    const _dashboardRemoteConfig: any = this.authenticationService._getConfigModule('dashboard');
    this._minutesPeriodo1 = _dashboardRemoteConfig.periodi.periodo_1;
    this._minutesPeriodo2 = _dashboardRemoteConfig.periodi.periodo_2;

    // this.eventsManagerService.on(EventType.REFRESH_DATA, (event: any) => {
    //   this.loadData();
    // });
  }

  ngOnInit(): void {
    // this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    let _refresh: boolean = false;
    if (changes.environmentId && changes.environmentId.currentValue) {
      this.environmentId = changes.environmentId.currentValue;
      _refresh = true;
    }
    if (changes.section && changes.section.currentValue) {
      this.section = changes.section.currentValue;
      _refresh = true;
    }
    if (_refresh) {
      // this.loadData();
    }
  }

  @HostListener('window:keydown', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'd' && event.ctrlKey) {
      this.showDebug = !this.showDebug;
    }
  }

  loadData() {
    this.spin = true;
    const path: string = `${this.environmentId}${this.section.path}`;
    setTimeout(() => {
      this.spin = false;
    }, 1000);
  }

  onAction(block: any) {
    this.action.emit(block);
  }

  _getBlockPeriod(block: any) {
    return (block.name) ? this._minutesPeriodo1 : this._minutesPeriodo2;
  }

  _getBlockPeriodHours(block: any) {
    const _period = (block.name === 'periodo1') ? this._minutesPeriodo1 : this._minutesPeriodo2;
    return Math.floor(_period / 60);
  }

  _getBlockTraslateData(block: any) {
    const _period = (block.name === 'periodo1') ? this._minutesPeriodo1 : this._minutesPeriodo2;
    const _hours = String(Math.floor(_period / 60));
    let _minutes = String(_period % 60);
    if (_minutes === '0') {
      _minutes = '';
    } else {
      _minutes = `e ${_minutes}'`;
    }

    return {hours: _hours, minutes: _minutes };
  }
}
