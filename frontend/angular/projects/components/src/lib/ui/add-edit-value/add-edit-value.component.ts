import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ui-add-edit-value',
  templateUrl: './add-edit-value.component.html',
  styleUrls: [
    './add-edit-value.component.scss'
  ]
})
export class AddEditValueComponent implements OnInit {

  @Input('value') _value = '';
  @Input('pholder') _placehoder = '';

  @Output() save: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() {}

  _save() {
    this.save.emit({ value: this._value });
    this._value = '';
  }
}
