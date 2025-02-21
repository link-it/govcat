import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'lnk-form-error',
  templateUrl: './form-error.component.html',
  styleUrls: ['./form-error.component.scss']
})
export class LnkFormErrorComponent implements OnInit {
  @Input() message: string = '';

  constructor() { }

  ngOnInit() {
  }

}
