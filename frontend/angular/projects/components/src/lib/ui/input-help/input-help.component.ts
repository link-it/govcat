import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { TranslateService } from '@ngx-translate/core';
import { MarkedOptions, MarkedRenderer } from 'ngx-markdown';

@Component({
  selector: 'ui-input-help',
  templateUrl: './input-help.component.html',
  styleUrls: [
    './input-help.component.scss'
  ]
})
export class InputHelpComponent implements OnInit, OnChanges {

  @Input() field: string = '';
  @Input() context: string = '';
  @Input() params: any = {};

  _text: string = '';
  _existsValue: boolean = false;

  constructor(
    private sanitized: DomSanitizer,
    private translate: TranslateService
  ) { }

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.field) {
      this.field = changes.field.currentValue;
      const _value: string = this.translate.instant(`APP.LABEL_HELP.${this.context}.${this.field}`, this.params);
      this._text = `${_value}`;
      this._existsValue = !_value.includes('APP.LABEL_HELP.') && (_value !== '');
    }
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html)
  }
}
