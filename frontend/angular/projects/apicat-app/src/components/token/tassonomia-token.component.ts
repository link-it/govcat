import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'ui-tassonomia-token',
  templateUrl: './tassonomia-token.component.html',
  styleUrls: ['./tassonomia-token.component.scss']
})
export class TassonomiaTokenComponent implements OnInit {

  @Input() data: any = null;

  @Output() delete: EventEmitter<any> = new EventEmitter();
  
  constructor() { }

  ngOnInit() {
  }

  deleteData(event: any, data: any) {
    this.delete.emit({event: event , data: data});
  }
}
