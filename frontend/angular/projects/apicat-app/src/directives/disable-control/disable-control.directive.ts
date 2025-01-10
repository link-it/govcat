import { Directive, Input } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: '[disableControl]'
})
export class DisableControlDirective {

  _ngControl: NgControl;

  @Input() set disableControl(condition: boolean) {
    const action = condition ? 'disable' : 'enable';
    if (this._ngControl && this._ngControl.control) {
      this._ngControl.control[action]();
    }
  }

  constructor(private ngControl: NgControl) {
    this._ngControl = ngControl;
  }
}
