import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';

import { AvailbleBSPositions } from 'ngx-bootstrap/positioning';

type InputType = 'text' | 'date' | 'textarea' | 'number' | 'checkbox' | 'password' | 'select';

@Component({
    selector: 'lnk-form-field',
    templateUrl: './form-field.component.html',
    styleUrls: ['./form-field.component.scss']
})
export class LnkFormFieldComponent implements OnInit {

    @Input() id: string = '';
    @Input() type: InputType = 'text';
    @Input() name: string = '';
    @Input() label: string = '';
    @Input() isEdit: boolean = false;
    @Input() formGroup!: FormGroup;
    @Input() value: any = '';

    @Input() selectOptions: string[] = [];
    @Input() clearable: boolean = true;

    @Input() autocomplete: string = 'off';
    @Input() placeholder?: string;
    @Input() rows: number = 3;
    @Input() disabled: boolean = false;
    @Input() inline: boolean = false;
    @Input() singleColumn: boolean = false;
    @Input() smallLabel: boolean = false;
    @Input() plainText: boolean = true;
    @Input() useOptional: boolean = false;
    @Input() uppercase: boolean = false;
    @Input() reduced: boolean = false;
    @Input() useParagraph: boolean = false;

    @Input() showHelp: boolean = true;
    @Input() showHelpOnlyEdit: boolean = true;
    @Input() iconHelp: string = 'bi bi-info-circle';
    @Input() helpPlacement: AvailbleBSPositions = 'left';
    @Input() helpContext: string = '';
    @Input() helpParams: any = {};

    @Input() options: any = null;

    @Output() changeEvent = new EventEmitter<any>();

    get formControl(): AbstractControl {
        return this.formGroup.get(this.name) as AbstractControl;
    }

    hasError() {
        return (this.formControl && this.formControl.errors && this.formControl.touched);
    }

    ngOnInit(): void {
        this.reflectDisabledStatus()

        if (this.id === '') {
            this.id = this.name;
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['disabled']) {
            this.reflectDisabledStatus()
        }
    }

    private reflectDisabledStatus() {
        const control = this.formGroup.get(this.name);
        if (this.disabled) {
            control?.disable();
        } else {
            control?.enable();
        }
    }

    onChange(event: any) {
        this.changeEvent.emit(event);
    }

    get colClassLabel(): string {
        return this.singleColumn && !this.inline ? `col-lg-12` : (this.options ? `col-lg-${this.options.Formfield.colLabel}` : `col-lg-4`);
    }

    get colClassValue(): string {
        return this.singleColumn && !this.inline ? `col-lg-12` : (this.options ? `col-lg-${this.options.Formfield.colValue}` : `col-lg-8`);
    }

    hasHelpMapper = (isEdit: boolean, key: string) => {
        if (this.showHelp) {
            return this.showHelpOnlyEdit ? isEdit : true
        }
        return false;
    }
}
