import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

import { ConfigService } from 'projects/tools/src/lib/config.service';
import { Tools } from 'projects/tools/src/lib/tools.service';
import { EventsManagerService } from 'projects/tools/src/lib/eventsmanager.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.component.html',
  styleUrls: ['home.component.scss']
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
