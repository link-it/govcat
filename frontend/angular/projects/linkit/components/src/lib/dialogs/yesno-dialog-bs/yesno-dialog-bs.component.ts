import { Component, OnInit } from '@angular/core';
import { Subject } from 'rxjs';

import { BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    selector: 'app-yesno-dialog-bs',
    templateUrl: './yesno-dialog-bs.component.html',
    styleUrls: ['./yesno-dialog-bs.component.scss'],
    standalone: false
})
export class YesnoDialogBsComponent implements OnInit {

  title: string = '';
  messages: string[] = [];
  cancelText: string = 'Cencel';
  confirmText: string = 'Confirm';
  confirmColor: string = 'confirm';

  onClose: Subject<any> = new Subject();

  constructor(
    public bsModalRef: BsModalRef
  ) { }

  ngOnInit() {
    this.onClose = new Subject();
  }

  closeModal(confirm: boolean = false) {
    this.onClose.next(confirm);
    this.bsModalRef.hide();
  }
}
