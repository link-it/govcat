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
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ConfigService } from '@linkit/components';
import { Tools } from '@linkit/components';
import { EventsManagerService } from '@linkit/components';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss'],
  standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  static readonly Name = 'HomeComponent';

  config: any;

  _toggleFilter: boolean = false;

  showHistory: boolean = true;
  showSearch: boolean = true;
  showSorting: boolean = true;

  sortField: string = 'date';
  sortDirection: string = 'asc';
  sortFields: any[] = [
    { field: 'date', label: 'Data', icon: '' },
    { field: 'ente', label: 'Ente', icon: '' },
    { field: 'importo', label: 'Importo', icon: '' },
    { field: 'tipo', label: 'Tipo', icon: '' },
    { field: 'stato', label: 'Stato', icon: '' }
  ];

  searchFields: any[] = [
    { field: 'date', label: 'Data', icon: '', type: 'date', format: 'dd-MM-yyyy' },
    { field: 'ente', label: 'Ente', icon: '', type: 'text' },
    { field: 'importo', label: 'Importo', icon: '', type: 'number' },
    { field: 'tipo', label: 'Tipo', icon: '', type: 'text' },
    { field: 'stato', label: 'Stato', icon: '', type: 'text' }
  ];

  breadcrumbs: any[] = [
    { label: 'APP.TITLE.Home', url: '', type: 'title', icon: 'home' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private translate: TranslateService,
    private configService: ConfigService,
    public tools: Tools,
    public eventsManagerService: EventsManagerService
  ) {
    this.config = this.configService.getConfiguration();

    this.__toggleFilter();
  }

  ngOnInit() {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      // Changed
    });
  }

  ngOnDestroy() {
  }

  __toggleFilter() {
    this._toggleFilter = !this._toggleFilter;
    if (this._toggleFilter) {
      Tools.ScrollTo(0);
    }
  }

  _dummyAction(event: any, param: any) {
    console.log(event, param);
  }

  onSort(event: any) {
    console.log(event);
  }
}
