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

// ng-select-wrapper.component.ts
import { Component, Input, Output, EventEmitter, forwardRef } from "@angular/core";
import { ControlValueAccessor, FormGroup, NG_VALUE_ACCESSOR } from "@angular/forms";

@Component({
    selector: "lnk-form-select",
    templateUrl: "./form-field-select.component.html",
    styleUrls: ["./form-field-select.component.scss"],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => LnkFormSelectComponent),
            multi: true,
        },
    ],
    standalone: false
})
export class LnkFormSelectComponent implements ControlValueAccessor {
    @Input() label?: string;
    @Input() items: any[] = [];
    @Input() bindLabel: string = "label";
    @Input() bindValue: string = "value";
    @Input() placeholder: string = "Select...";
    @Input() formGroup!: FormGroup;
    @Input() formControlName!: string;
    @Input() searchable: boolean = false;
    @Input() clearable: boolean = false;
    @Input() multiple: boolean = false;
    @Input() useOptional: boolean = false;

    @Output() changeEvent = new EventEmitter<any>();

    value: any;
    @Input() disabled: boolean = false;

    onItemSelect(item:any){
        this.onChange(item ? item.value : undefined);
    }

    onChange: any = () => {};
    onTouched: any = () => {};

    writeValue(value: any): void {
        this.value = value;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        // this.disabled = isDisabled;
    }
}
