import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ui-allegato',
  templateUrl: './allegato.component.html',
  styleUrls: ['./allegato.component.scss']
})
export class AllegatoComponent implements OnInit {
  @ViewChild('browse', { static: false, read: ElementRef }) _browse!: ElementRef;

  @Input() required: boolean = false;
  @Input() readonly: boolean = false;
  @Input() disabled: boolean = false;
  @Input() multiple: boolean = false;
  @Input() appearance: string = 'fill';
  @Input() label: string = '';
  @Input() hint: string = '';
  @Input() maxUpload: number | null = null;
  @Input() control!: FormControl;

  @Output() fileChanged: EventEmitter<any> = new EventEmitter();
  @Output() resetControl: EventEmitter<any> = new EventEmitter();
  @Output() oversizeError: EventEmitter<any> = new EventEmitter();

  _file!: File;
  _selected: boolean = false;

  _file_extension: string = '';

  constructor() { }

  ngOnInit() {
    if (this.control) {
      this.control.valueChanges.subscribe((value: any) => {
        this._selected = !!value;
      });
      this._selected = !!this.control.value;
    }

    (this.label == 'Logo') ? this._file_extension = '.jpg' : this._file_extension = '';
  }

  hasControlError() {
    return (this.required && !this._selected && !this.disabled);
  }

  __triggering() {
    if (!this.disabled && !this.readonly) {
      if (this._selected) {
        this.__reset();
      } else {
        this._browse.nativeElement.click();
      }
    }
  }

  __onChange(event: any) {
    if (event.currentTarget.files && event.currentTarget.files.length !== 0) {
      if (this.multiple) {
        event.currentTarget.files.forEach((file: any) => {
          this._file = file;
          if (!this.maxUpload || this._file.size < this.maxUpload) {
            if (this.control) {
              this.toBase64(this._file);
            }
          } else {
            this.oversizeError.emit({ type: 'oversize', limit: this.maxUpload });
            this._browse.nativeElement.value = '';
          }
        });
        this.__reset();
      } else {
        this._file = event.currentTarget.files[0];
        if (!this.maxUpload || this._file.size < this.maxUpload) {
          if (this.control) {
            this.toBase64(this._file);
          }
        } else {
          this.oversizeError.emit({ type: 'oversize', limit: this.maxUpload });
          this._browse.nativeElement.value = '';
        }
      }
    }
  }

  protected __reset() {
    if (this.control) {
      this.control.setValue('');
      this.resetControl.emit({ type: 'reset' });
    }
    if (this._browse && this._browse.nativeElement) {
      this._browse.nativeElement.value = '';
    }
  }

  protected toBase64(file: File) {
    if (file) {
      this.hint = '';
      try {
        const reader = new FileReader();  
        reader.onload = (e: any) => {
          const result = e.target.result;
          if (result.toString().indexOf('base64,') !== -1) {
            const b64 = result.toString().split('base64,')[1];
            const ext: any = (/\.[A-Za-z0-9]+$/).exec(file.name);
            const _fileType = file.type || (ext && ext.length ? ext[0].substring(1) : '');
            this.loadFile(file.name, b64, _fileType, result.toString());
          }
        };
        reader.readAsDataURL(file);
      } catch (e) {
        this.hint = 'Errore in lettura';
      }
    }
  }

  reset() {
    this.__reset();
  }

  loadFile(_name: string, _data: string, _type: string = '', _dataURL: string = '') {
    if (this.control) {
      this.control.setValue({ file: _name, data: _data, type: _type, dataURL: _dataURL });
      this.fileChanged.emit({ type: 'file_changed' });
    }
  }
}
