import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ui-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class UIButtonComponent implements OnInit {

  @Input() type: string = 'button'; // button | submit
  @Input() label: string = '';
  @Input() disabled: boolean = false;
  @Input() icon: string | null = null;
  @Input() onlyIcon: boolean = false;
  @Input() size: string = 'md'; // sm | md
  @Input() primary: boolean = false;
  @Input() tertiary: boolean = false;
  @Input() otherClass: string = '';
  @Input() ariaLabel: string = '';
  @Input() spinner: boolean = false;
  @Input() onlySpinner: boolean = false;
  @Input() btnTooltip: string = '';

  @Output() onAction = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  _onClick() {
    this.onAction.emit({});
  }
}
