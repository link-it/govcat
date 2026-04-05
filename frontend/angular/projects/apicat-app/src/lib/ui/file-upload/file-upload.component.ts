/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// https://github.com/NetanelBasal/ng-file-upload/tree/master/src/app

import { Component, ElementRef, HostListener, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { ProgressComponent } from '../progress/progress.component';

@Component({
    selector: 'app-file-upload',
    templateUrl: './file-upload.component.html',
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: FileUploadComponent,
            multi: true
        }
    ],
    styleUrls: ['./file-upload.component.scss'],
    standalone: true,
    imports: [ProgressComponent]
})
export class FileUploadComponent implements ControlValueAccessor {
  @Input() progress: any;
  onChange!: Function;
  onTouched!: Function;
  file: File | null = null;

  @HostListener('change', ['$event']) emitFiles( event: Event ) {
    const input = event.target as HTMLInputElement;
    const file = input?.files?.item(0);
    this.file = file || null;
    this.onChange(file);
  }

  constructor( private readonly host: ElementRef<HTMLInputElement> ) {
  }

  writeValue( value: null ) {
    // clear file input
    this.host.nativeElement.value = '';
    this.file = null;
  }

  registerOnChange( fn: Function ) {
    this.onChange = fn;
  }

  registerOnTouched( fn: Function ) {
    this.onTouched = fn;
  }
}
