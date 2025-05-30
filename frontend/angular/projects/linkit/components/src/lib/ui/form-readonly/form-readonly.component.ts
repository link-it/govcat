import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FieldClass } from '../classes/definitions';

@Component({
    selector: 'ui-form-readonly',
    templateUrl: './form-readonly.component.html',
    styleUrls: [
        './form-readonly.component.scss'
    ],
    standalone: false
})
export class FormReadonlyComponent {

  @Input('fields') _fields!: FieldClass[];
  @Input('columns') _columns: number = 6;

  @Output() downloadClick: EventEmitter<any> = new EventEmitter();

  __downloadClick(item: any) {
    this.downloadClick.emit({ item });
  }
}
