import { AfterContentChecked, AfterViewInit, Component, ElementRef, EventEmitter, HostListener, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { Tools } from 'projects/tools/src/lib/tools.service';

import * as moment from 'moment';

@Component({
  selector: 'ui-sender',
  templateUrl: 'sender.component.html',
  styleUrls: ['sender.component.scss']
})
export class SenderComponent implements OnInit, AfterContentChecked, AfterViewInit {
  static readonly Name = 'SendComponent';

  @ViewChild('msg', { static: false, read: ElementRef }) _messaggio!: ElementRef;
  @ViewChild('msgBar', { read: ElementRef, static: false }) _msgBar!: ElementRef;
  @ViewChild('browse', { static: false, read: ElementRef }) _browse!: ElementRef;

  @Output() download: EventEmitter<any> = new EventEmitter<any>();
  @Output() send: EventEmitter<any> = new EventEmitter<any>();

  Tools = Tools;
  readonly bp: string = 'md';

  _size: number = 48;
  _file!: File;
  _placeholder: string = 'Testo del messaggio...';
  _allegati: any[] = [];
  _formValid: boolean = false;
  _formGroup: FormGroup = new FormGroup({});
  _msgCtrl = new FormControl('', Validators.required);
  _allegatiCtrl: FormControl = new FormControl('');

  constructor(private tools: Tools, private router: Router) {
    this._formGroup = new FormGroup({
      messaggio: this._msgCtrl,
      allegati: this._allegatiCtrl
    });
  }

  ngOnInit() {
    this.__init();
  }

  ngAfterContentChecked() {
    this._formValid = (this._formGroup && this._formGroup.valid);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this._messaggio.nativeElement.focus();
    }, 200);
  }

  __init() { }

  _downloadAllegato(allegato: any) {
    this.download.emit({ allegato });
  }

  __clearAllegatoCtrl() {
    this._allegati = [];
    this._allegatiCtrl.setValue('');
    this._allegatiCtrl.setErrors(null);
    this._allegatiCtrl.clearValidators();
    this._allegatiCtrl.updateValueAndValidity();
  }

  __resetMsg() {
    this._msgCtrl.setErrors(null);
    this._msgCtrl.setValue('');
    this._msgCtrl.setValidators(Validators.required);
    if (this._messaggio) {
      this._messaggio.nativeElement.innerText = this._placeholder;
    }
  }

  __browse(event: any) {
    this._browse.nativeElement.click();
  }

  __send(form: any) {
    this.send.emit({ form });
    this.resetForm();
  }

  __chipClick(index: number) {
    this._allegati.splice(index, 1);
    this._allegatiCtrl.setValue(this._allegati);
  }

  __inputChange(event: any) {
    this._msgCtrl.setValue(event.currentTarget.innerText.trim());
  }

  __onClickText() {
    // if (this.afd && this._messaggio && this._messaggio.nativeElement) {
    //   this.afd.selectText(this._messaggio.nativeElement);
    // }
  }

  __onBlur() {
    // if (this._messaggio && this._messaggio.nativeElement) {
    //   if (this._messaggio.nativeElement.innerText.trim() === '') {
    //     this._placeholder = 'Testo del messaggio...';
    //     this._messaggio.nativeElement.innerText = this._placeholder;
    //   }
    // }
  }

  __onChange(event: any) {
    // console.log('change');
    const MAXK: number = Tools.MaxUpload()
    if (event.currentTarget.files && event.currentTarget.files.length !== 0) {
      this._file = event.currentTarget.files[0];
      if (!MAXK || this._file.size < MAXK) {
        if (this._allegatiCtrl) {
          this.__toBase64();
        }
      } else {
        Tools.FileExceedError(MAXK);
      }
      this._browse.nativeElement.value = '';
    }
  }

  __reset() {
    // this._file = undefined;
    if (this._allegatiCtrl) {
      this._allegatiCtrl.setValue('');
      // this.resetControl.emit({ type: 'reset' });
    }
    if (this._browse && this._browse.nativeElement) {
      this._browse.nativeElement.value = '';
    }
  }

  __toBase64() {
    if (this._file) {
      try {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          const result = e.target.result;
          if (result.toString().indexOf('base64,') !== -1) {
            const b64 = result.toString().split('base64,')[1];
            const ext: any = (/\.[A-Za-z0-9]+$/).exec(this._file.name);
            this.__loadFile(this._file.name, b64, result.toString(), (this._file.type || ext[0].substring(1) || ''));
          }
        };
        reader.readAsDataURL(this._file);
      } catch (e) {
        // Tools.Alert('Si sono verificati problemi durante la lettura del file.');
      }
    }
  }

  __loadFile(_name: string, _data: string, _dataURL: string, _type: string = '') {
    if (this._allegatiCtrl) {
      this._allegati.push({ file: _name, data: _data, dataURL: _dataURL, type: _type });
      this._allegatiCtrl.setValue(this._allegati);
      // this.fileChanged.emit({ type: 'file_changed' });
    }
  }

  __mapDateGroup(el: any): string {
    return (el.mDate.format('DDMMYYYY') !== moment().add(-1, 'days').format('DDMMYYYY')?el.date:'Ieri');
  }

  resetForm() {
    this.__reset();
    this.__resetMsg();
    this.__clearAllegatoCtrl();
  }
}
