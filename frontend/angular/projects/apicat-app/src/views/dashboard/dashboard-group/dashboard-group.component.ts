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
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { EventType } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';
import { AuthenticationService } from '../../../services/authentication.service';
import { OpenAPIService } from '../../../services/openAPI.service';
import { UtilService } from '@app/services/utils.service';

import { AmbienteEnum } from '../../../model/ambienteEnum';

@Component({
  selector: 'app-dashboard-group',
  templateUrl: './dashboard-group.component.html',
  styleUrls: ['./dashboard-group.component.scss'],
  standalone: false
})
export class DashboardGroupComponent implements OnInit, OnChanges {

  @Input() environmentId: AmbienteEnum = AmbienteEnum.Collaudo;
  @Input() type: string = '';
  @Input() sections: any[] = [];
  @Input() period1: any = {};
  @Input() period2: any = {};
  @Input() reduced: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();

  _spin: boolean = false;

  constructor(
    private eventsManagerService: EventsManagerService,
    private authenticationService: AuthenticationService,
    private apiService: OpenAPIService,
    private utilService: UtilService
  ) {
    this.eventsManagerService.on(EventType.REFRESH_DATA, (event: any) => {
      this.loadData();
    });
  }

  onAction(event: any, section: any) {
    this.action.emit({ block: event, section: section });
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
    if (changes.sections && changes.sections.currentValue) {
      this.sections = changes.sections.currentValue;
      _refresh = true;
    }
    if (changes.period1 && changes.period1.currentValue) {
      this.period1 = changes.period1.currentValue;
      _refresh = true;
    }
    if (changes.period2 && changes.period2.currentValue) {
      this.period2 = changes.period2.currentValue;
      _refresh = true;
    }
    if (_refresh) {
      this.loadData();
    }
  }

  loadData() {
    this._spin = true;

    this.sections.forEach((section: any) => {
      let aux: any;
      let _data: any = null;
      if (section.range) {
        _data = { ...this.period1, ...this.period2 };
      }
      if (_data) aux = { params: this.utilService._queryToHttpParams(_data) };

      this.apiService.getMonitor(`${this.environmentId}${section.path}`, aux).subscribe({
        next: (response: any) => {
          section.blocks.forEach((block: any) => {
            block.count = response[block.name];
          });
          this._spin = false;
        },
        error: (error: any) => {
          section.blocks.forEach((block: any) => {
            block.count = -1;
          });
          this._spin = false;
        }
      });
    });
  }
}
