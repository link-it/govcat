import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'ui-input-help',
    templateUrl: './input-help.component.html',
    styleUrls: [
        './input-help.component.scss'
    ],
    standalone: false
})
export class InputHelpComponent implements OnChanges {

  @Input() field: string = '';
  @Input() context: string = '';
  @Input() params: any = {};

  _text: string = '';
  _existsValue: boolean = false;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['field']) {
      this.field = changes['field'].currentValue;
      const _value: string = this.translate.instant(`APP.LABEL_HELP.${this.context}.${this.field}`, this.params);
      this._text = `${_value}`;
      this._existsValue = !_value.includes('APP.LABEL_HELP.') && (_value !== '');
    }
  }
}
