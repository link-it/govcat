import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

export enum ActionEnum {
  SEARCH = 'search',
  SELECTION = 'selection',
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

  @Input() menuActions: MenuExportAction[] = [];
  @Input() title: string = 'APP.MENU.Services';
  @Input() allElements: number = 0;
  @Input() countSelected: number = 0;
  @Input() uncheckAllInTheMenu: boolean = true;

  @Output() action: EventEmitter<any> = new EventEmitter();

  ActionEnum = ActionEnum;

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
        title: this.title,
        enabled: true
      },
      {
        type: 'menu',
        title: 'APP.MENU.ExportSearch',
        icon: '',
        subTitle: '',
        action: ActionEnum.SEARCH,
        enabled: this.allElements > 0,
        badge: String(this.allElements)
      },
      {
        type: 'menu',
        title: 'APP.MENU.ExportSelected',
        icon: '',
        subTitle: '',
        action: ActionEnum.SELECTION,
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
