import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

import { BreadcrumbService } from './breadcrumb.service';
import { EventsManagerService } from '../../services';
import { EventType } from '../../classes/events';

import * as _ from 'lodash';

@Component({
    selector: 'ui-breadcrumb',
    templateUrl: './breadcrumb.component.html',
    styleUrls: ['./breadcrumb.component.scss'],
    standalone: false
})
export class BreadcrumbComponent implements OnInit, OnChanges {
  @Input() breadcrumbs: any[] = [];
  @Input() useGroups: boolean = false;
  @Input() classContainer: string = '';
  @Input() optional: boolean = false;
  @Input() hideToggleMobile: boolean = false;

  @Output() onClick: EventEmitter<any> = new EventEmitter();

  _breadcrumbs: any[] = [];
  
  groupsBreadcrumbs: any[] = [];

  constructor(
    private eventsManagerService: EventsManagerService,
    private breadcrumbService: BreadcrumbService
  ) {
    this.eventsManagerService.on('UPDATE_BREADCRUMBS', (event: any) => {
      this._updateBreadcrumbs();
    });
  }

  ngOnInit(): void {
    this._updateBreadcrumbs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.breadcrumbs) {
      this.breadcrumbs = changes.breadcrumbs.currentValue;
      this._breadcrumbs = [ ...this.breadcrumbs ];
    }
    if (changes.useGroups) {
      this.useGroups = changes.useGroups.currentValue;
    }
    this._updateBreadcrumbs();
  }

  _updateBreadcrumbs() {
    const groupsBreadcrumbs = this.breadcrumbService.getBreadcrumbs();
    if (groupsBreadcrumbs && this.useGroups) {
      this.groupsBreadcrumbs = groupsBreadcrumbs.groupsBreadcrumbs;
      if (this.groupsBreadcrumbs.length && this._breadcrumbs.length) {
        const _first = this._breadcrumbs.slice(0, 1);
        _first[_first.length - 1].group = true;
        _first[_first.length - 1].url = 'root';
        const _last = this._breadcrumbs.slice(1);
        this.breadcrumbs = [ ..._first, ...this.groupsBreadcrumbs, ..._last ];
      }
    }
  }

  _onClick(item: any) {
    if (item.group) {
      this._onGoupsBreadcrumbs(item);
      this.onClick.emit(item);
    } else {
      if (item.url) {
        this.onClick.emit(item);
      }
    }
  }

  _onOpenSidebar() {
    this.eventsManagerService.broadcast(EventType.NAVBAR_OPEN, { value: EventType.NAVBAR_OPEN });
  }

_onGoupsBreadcrumbs(group: any) {
    const _index = this.groupsBreadcrumbs.findIndex((item: any) => { return item.url === group.url; });
    this.groupsBreadcrumbs = _.slice(this.groupsBreadcrumbs, 0, _index + 1);
    this.breadcrumbs = [ ...this._breadcrumbs, ...this.groupsBreadcrumbs ];

    const data: any = {
      currIdGruppoPadre: (group.url === 'root') ? '' : group.url,
      gruppoPadreNull: (group.url === 'root'),
      groupsBreadcrumbs: this.groupsBreadcrumbs
    };
    this.breadcrumbService.storeBreadcrumbs(data);
  }
}
