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
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { Observable } from "rxjs";

import { ConfigService } from '@linkit/components';

@Component({
  selector: "[recursiveCategory]",
  templateUrl: "./tree-view-category.component.html",
  styleUrls: ["./tree-view-category.component.scss"],
  standalone: false
})
export class TreeViewCategoryComponent implements OnChanges {

  @Input() level!: number;
  @Input() children: any[] | undefined;
  @Input() parent: any;
  @Input() forceOpen: boolean = false;
  @Input() isEditable: boolean = true;
  @Input() isRemovable: boolean = true;
  @Input() forceActions: boolean = false;
  @Input() selectable: boolean = false;
  @Input() hideImage: boolean = false;
  @Input() editTooltip: string = 'EditGroup';
  @Input() addTooltip: string = 'AddGroup';
  @Input() removeTooltip: string = 'RemoveGroup';
  @Input() iconOpen: string = 'chevron-down';
  @Input() iconClose: string = 'chevron-right';
  @Input() iconFolder: string = 'folder';
  @Input() iconLeaf: string = 'circle';
  @Input() notSelectable: any[] = [];
  @Input() enabled: boolean = true;
  @Input() countChildren: number = 0;

  @Input() search!: (any: any) => Observable<any>;

  @Output() open: EventEmitter<any> = new EventEmitter();
  @Output() action: EventEmitter<any> = new EventEmitter();

  self = this;

  apiUrl: string = '';

  constructor(
    private configService: ConfigService
  ) {
    const _appConfig = this.configService.getConfiguration();
    this.apiUrl = _appConfig.AppConfig.GOVAPI.HOST;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const _children = changes.children ? changes.children.currentValue : [];
    this.children = _children.map((item: any) => {
      item.isOpen = item.isOpen || (changes.forceOpen ? changes.forceOpen.currentValue : true);
      return item;
    });
    this.countChildren = changes.countChildren ? changes.countChildren.currentValue : _children.length;
  }

  onOpen(item: any) {
    item.isOpen = !item.isOpen;
    this.action.emit({action: item.isOpen ? 'open' : 'close', item: item});
    // if (!item.children) {
    //   item.loading = "....";
    //   this.search(item.id).subscribe(res=>{
    //     item.loading = null
    //     item.children = res;
    //   })
    // }
  }

  onOpenInternal(event: any) {
    this.action.emit(event);
  }

  onAction(event: any, action: any, item: any) {
    event.stopImmediatePropagation();
    event.preventDefault();
    if (!this.isNotSelectable(item)) {
      if (this.selectable) { 
        this.action.emit({action: 'select', item: item});
      } else {
        this.action.emit({action: action, item: item});
      }
    }
  }

  onActionInternal(event: any) {
    this.action.emit(event);
  }

  isNotSelectable(item: any) {
    const index = this.notSelectable?.findIndex((i: any) => {
      if (i.id_gruppo) {
        return (i.id_gruppo === item.id_gruppo)
      }
      if (i.id_categoria) {
        return (i.id_categoria === item.id_categoria)
      }
      return false;
    });
    return (index !== -1);
  }

  hasServiziMapper = (item: any): boolean => {
    return !!item.servizi;
  }

  hasDeleteMapper = (item: any): boolean => {
    let _hasDelete = !(item.hasChildren || item.children || item.figli || !!item.servizi);

    if (item.tassonomia && item.tassonomia.visibile && _hasDelete) {
      if (!!item.root) {
        _hasDelete = (this.countChildren > 1);
      }
    }

    return _hasDelete;
  }

  onDebug(data: any) {
    console.log(data);
  }
}
