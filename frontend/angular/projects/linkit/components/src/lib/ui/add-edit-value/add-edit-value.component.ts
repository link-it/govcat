import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ui-add-edit-value',
    templateUrl: './add-edit-value.component.html',
    styleUrls: [
        './add-edit-value.component.scss'
    ],
    standalone: false
})
export class AddEditValueComponent {

  @Input('value') _value = '';
  @Input('pholder') _placehoder = '';

  @Output() save: EventEmitter<any> = new EventEmitter();

  _save() {
    this.save.emit({ value: this._value });
    this._value = '';
  }
}
