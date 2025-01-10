import { Component, EventEmitter, Input, OnInit, Output, TemplateRef } from '@angular/core';

/**
 * Trigger ng-content select: [trigger]
 *
 * <link-repeater #rptr [list]="values" [itemTemplate]="itemTemplateRef">
 *  <ng-template #itemTemplateRef let-item>
 *    <div [prop]="item"></div>
 *  </ng-template>
 *  <div trigger (trigger-event)="fct(rptr)"></div>
 * </link-repeater>
 */
@Component({
  selector: 'ui-repeater',
  templateUrl: 'repeater.component.html',
  styleUrls: [
    './repeater.component.scss'
  ]
})
export class RepeaterComponent implements OnInit {
  _class: string = 'btn gl-button btn-default mt-5 ms-2 align-self-start';
  _data: any[] = [];

  @Input() set list(value: any[]) {
    this._data = value;
  }
  get list(): any[] {
    return this._data;
  }
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() trigger: boolean = false;
  @Input() edit: boolean = true;
  @Input() disableTrigger: boolean = false;
  @Input() actionPropertyDisabled: string = '';
  @Input() itemTemplate!: TemplateRef<any>;

  @Output() remove: EventEmitter<any> = new EventEmitter();
  @Output() insert: EventEmitter<any> = new EventEmitter();

  constructor() { }

  ngOnInit() { }

  __onKeyRemove(event: KeyboardEvent, target: any, index: number) {
    if (event && (event.keyCode === 13 || event.code === 'Enter')) {
      this.__remove(event, target, index);
    }
  }

  __remove(event: any, target: any, index: number) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!this.disabled && !target[this.actionPropertyDisabled] && this._data && this._data.length > 0) {
      this._data.splice(index,1);
      this.remove.emit({ target, index });
    }
  }

  __onKeyAdd(event: KeyboardEvent) {
    if (event && (event.keyCode === 13 || event.code === 'Enter')) {
      this.__add(event);
    }
  }

  __add(event: any) {
    if (this.trigger && !this.disableTrigger) {
      // this.disableTrigger = true;
      this.insert.emit({ event });
    }
  }

  /**
   * Adds element to repeater
   * @param target
   */
  add(target: any) {
    // this.disableTrigger = true;
    if (this._data) {
      this._data.push(target);
    }
  }

  /**
   * Remove element from repeater
   * @param index
   */
  eliminate(index: number) {
    if (this._data && index !== -1) {
      const target: any = this._data[index];
      if (target) {
        this._data.splice(index,1);
        this.remove.emit({ target, index });
      }
    }
  }

  /**
   * Optional check for validation
   * @returns {boolean}
   */
  validate(): boolean {
    if (this.required) {
      return (this._data && this._data.length !== 0);
    }
    return true;
  }

}
