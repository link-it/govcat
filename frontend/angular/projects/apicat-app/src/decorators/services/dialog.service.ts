import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Injectable({
  providedIn: 'root'
})
export class DialogService {

  modalService = inject(BsModalService)

  private static instance : DialogService | null = null;

  constructor() { 
    DialogService.instance = this;
  }

  public static getInstance(){
    return DialogService.instance;
  }

  openDialog<T>(data : any, component: ComponentType<T>): Observable<boolean>{

    const _modalConfirmRef: BsModalRef = this.modalService.show(component, data);
    return _modalConfirmRef.content.onClose;
  }
}
