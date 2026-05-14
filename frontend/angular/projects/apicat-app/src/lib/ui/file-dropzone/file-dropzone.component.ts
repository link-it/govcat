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
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';

/**
 * File-dropzone component: UI a dashed-border con drag & drop + click
 * per upload file. Alternativa visuale ricca rispetto a `ui-allegato`.
 *
 * API compatibile con `ui-allegato` (stessi `control` / `fileChanged` /
 * `resetControl` / `oversizeError`) + tre nuovi Input:
 * - `description`: sotto-titolo dentro la dropzone.
 * - `acceptedFormats`: lista delle estensioni accettate (es. ['.crt', '.pem']).
 * - `hint`: testo helper esterno mostrato sotto la dropzone.
 */
@Component({
    selector: 'ui-file-dropzone',
    templateUrl: './file-dropzone.component.html',
    styleUrls: ['./file-dropzone.component.scss'],
    standalone: true,
    imports: [CommonModule, TranslateModule]
})
export class FileDropzoneComponent implements OnInit {
    @ViewChild('browse', { static: false, read: ElementRef }) _browse!: ElementRef;

    @Input() control!: FormControl;
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    @Input() readonly: boolean = false;
    @Input() multiple: boolean = false;
    @Input() maxUpload: number | null = null; // bytes
    @Input() label: string = '';
    @Input() description: string = '';
    @Input() acceptedFormats: string[] = [];
    @Input() hint: string = '';

    @Output() fileChanged: EventEmitter<any> = new EventEmitter();
    @Output() resetControl: EventEmitter<any> = new EventEmitter();
    @Output() oversizeError: EventEmitter<any> = new EventEmitter();

    _file!: File;
    _selected: boolean = false;
    _isDragging: boolean = false;

    ngOnInit(): void {
        if (this.control) {
            this.control.valueChanges.subscribe((value: any) => {
                this._selected = !!value;
            });
            this._selected = !!this.control.value;
        }
    }

    get fileName(): string {
        if (this.multiple || !this.control || !this.control.value) return '';
        return this.control.value.file || this.control.value.filename || '';
    }

    get acceptAttribute(): string {
        return (this.acceptedFormats || []).join(',');
    }

    get formatsLabel(): string {
        return (this.acceptedFormats || []).join(' • ');
    }

    get maxUploadLabel(): string {
        if (!this.maxUpload) return '';
        const mb = this.maxUpload / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(0)} MB`;
        const kb = this.maxUpload / 1024;
        return `${kb.toFixed(0)} KB`;
    }

    hasControlError(): boolean {
        return !!(this.required && !this._selected && !this.disabled && this.control?.touched);
    }

    __onDragOver(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        if (!this.disabled && !this.readonly && !this._selected) this._isDragging = true;
    }

    __onDragLeave(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this._isDragging = false;
    }

    __onDrop(e: DragEvent): void {
        e.preventDefault();
        e.stopPropagation();
        this._isDragging = false;
        if (this.disabled || this.readonly || this._selected) return;
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            this.__handleFile(files[0]);
        }
    }

    __onClick(): void {
        if (this.disabled || this.readonly || this._selected) return;
        this._browse?.nativeElement?.click();
    }

    __onChange(event: any): void {
        const files = event?.currentTarget?.files;
        if (files && files.length > 0) this.__handleFile(files[0]);
    }

    __handleFile(file: File): void {
        this._file = file;
        if (this.maxUpload && file.size >= this.maxUpload) {
            this.oversizeError.emit({ type: 'oversize', limit: this.maxUpload });
            if (this._browse?.nativeElement) this._browse.nativeElement.value = '';
            return;
        }
        this.toBase64();
    }

    __reset(event?: Event): void {
        event?.stopPropagation();
        if (this.control) {
            this.control.setValue('');
            this.resetControl.emit({ type: 'reset' });
        }
        if (this._browse?.nativeElement) this._browse.nativeElement.value = '';
    }

    reset(): void { this.__reset(); }

    protected toBase64(): void {
        if (!this._file) return;
        try {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                const result = e.target.result;
                if (result?.toString().indexOf('base64,') !== -1) {
                    const b64 = result.toString().split('base64,')[1];
                    const extMatch = /\.[A-Za-z0-9]+$/.exec(this._file.name);
                    const type = this._file.type || (extMatch ? extMatch[0].substring(1) : '');
                    this.loadFile(this._file.name, b64, type, result.toString());
                }
            };
            reader.readAsDataURL(this._file);
        } catch (_e) {
            // silent — hint rimosso, l'utente vede comunque l'errore validator
        }
    }

    loadFile(_name: string, _data: string, _type: string = '', _dataURL: string = ''): void {
        if (this.control) {
            this.control.setValue({ file: _name, data: _data, type: _type, dataURL: _dataURL });
            this.fileChanged.emit({ type: 'file_changed' });
        }
    }
}
