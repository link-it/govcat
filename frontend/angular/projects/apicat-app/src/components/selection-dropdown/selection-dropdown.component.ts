import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ui-selection-dropdown',
  templateUrl: './selection-dropdown.component.html',
  styleUrls: ['./selection-dropdown.component.scss'],
  standalone: false
})
export class SelectionDropdownComponent implements OnInit {

  @Input() buttonTitle: string = 'APP.BUTTON.ChangeStatus';
  @Input() menuTitle: string = '';
  @Input() totalSeleted: number | undefined = 0;
  @Input() totalSearch: number | undefined = 0;
  @Input() loading: boolean = false;
  @Input() uncheckAllInTheMenu: boolean = true;

  @Output() action: EventEmitter<any> = new EventEmitter();
  
  constructor() { }

  ngOnInit() {
  }

  onAction(action: any) {
    this.action.emit({action: action});
  }

}
