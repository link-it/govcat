import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export enum ExportActionEnum {
  SEARCH = 'search',
  SELECTION = 'selection',
  ADESIONI_SEARCH = 'adensioniSearch',
  ADESIONI_SELECTION = 'adesioniSelection',
  SERVIZI_SEARCH = 'serviziSearch',
  SERVIZI_SELECTION = 'serviziSelection',
  DESELECT_ALL = 'deselectAll'
}

export interface MenuExportAction {
  type: string;
  title?: string;
  subTitle?: string;
  action?: string;
  url?: string;
  image?: string;
  icon?: string;
  micon?: string;
  iconUrl?: string;
  bgColor?: string;
  color?: string;
  enabled: boolean;
  checked?: boolean;
  submenus?: MenuExportAction[];
  badge?: string;
}

@Component({
  selector: 'app-export-dropdown',
  templateUrl: './export-dropdown.component.html',
  styleUrls: ['./export-dropdown.component.scss'],
  standalone: false
})
export class ExportDropdwnComponent implements OnInit, OnChanges {

  @Input() allElements: number = 0;
  @Input() countSelected: number = 0;
  @Input() uncheckAllInTheMenu: boolean = true;

  @Output() action: EventEmitter<any> = new EventEmitter();

  menuActions: MenuExportAction[] = [];

  ExportActionEnum = ExportActionEnum;

  constructor() {}

  ngOnInit() {
    this.initMenu();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.initMenu();
  }

  initMenu() {
    const menuActions: MenuExportAction[] = [
      {
        type: 'label',
        title: 'APP.MENU.EsportServiceSubscriptions',
        enabled: true
      },
      {
        type: 'menu',
        title: 'APP.MENU.EsportSearch',
        icon: '',
        subTitle: '',
        action: ExportActionEnum.ADESIONI_SEARCH,
        enabled: this.allElements > 0,
        badge: String(this.allElements)
      },
      {
        type: 'menu',
        title: 'APP.MENU.EsportSelected',
        icon: '',
        subTitle: '',
        action: ExportActionEnum.ADESIONI_SELECTION,
        enabled: this.countSelected > 0,
        badge: String(this.countSelected)
      },
      {
        type: 'divider',
        enabled: true
      },
      {
        type: 'label',
        title: 'APP.MENU.Services',
        enabled: true
      },
      {
        type: 'menu',
        title: 'APP.MENU.EsportSearch',
        icon: '',
        subTitle: '',
        action: ExportActionEnum.SERVIZI_SEARCH,
        enabled: this.allElements > 0,
        badge: String(this.allElements)
      },
      {
        type: 'menu',
        title: 'APP.MENU.EsportSelected',
        icon: '',
        subTitle: '',
        action: ExportActionEnum.SERVIZI_SELECTION,
        enabled: this.countSelected > 0,
        badge: String(this.countSelected)
      },
    ];

    this.menuActions = [ ...menuActions ];
  }

  onAction(menu: any) {
    const _action = typeof menu === 'string' ? menu : menu.action;
    this.action.emit({action: _action});
  }
}
