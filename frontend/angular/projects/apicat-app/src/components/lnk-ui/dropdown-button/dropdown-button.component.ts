import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { MenuAction } from '@linkit/components';

@Component({
  selector: 'lnk-dropdown-button',
  templateUrl: './dropdown-button.component.html',
  styleUrls: ['./dropdown-button.component.scss'],
  standalone: false
})
export class LnkDropdwnButtonComponent implements OnInit {

  @Input() title: string = 'menu';
  @Input() icon: string = '';
  @Input() items: MenuAction[] = [];
  @Input() menuEnd: boolean = false;

  @Output() action: EventEmitter<any> = new EventEmitter();

  constructor() {}

  ngOnInit() {
  }

  onAction(menu: any) {
    this.action.emit(menu.action);
  }
}
