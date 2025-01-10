import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FieldClass } from '../classes/definitions';
import { FieldType } from '../classes/definitions';

@Component({
  selector: 'ui-form-readonly',
  templateUrl: './form-readonly.component.html',
  styleUrls: [
    './form-readonly.component.scss'
  ]
})
export class FormReadonlyComponent implements OnInit {

  @Input('fields') _fields!: FieldClass[];
  @Input('columns') _columns: number = 6;

  @Output() downloadClick: EventEmitter<any> = new EventEmitter();

  public FieldType = FieldType;

  constructor(private sanitized: DomSanitizer) { }

  ngOnInit() {}

  __downloadClick(item: any) {
    this.downloadClick.emit({ item });
  }

  _sanitizeHtml(html: string) {
    return this.sanitized.bypassSecurityTrustHtml(html)
  }
}
