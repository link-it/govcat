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
import { AfterContentInit, ContentChildren, Directive, ElementRef, forwardRef, Input, OnDestroy, Output, QueryList, Renderer2 } from "@angular/core";
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from "@angular/forms";
import { merge, of, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";

@Directive({
    selector: 'input[type=checkbox][checkboxArrayKey]',
    standalone: false,
    host: {
        '(change)': 'onChange($event.target.checked)',
        '(blur)': 'onTouched()'
    }
})
export class CheckboxArrayKey {
    @Input("checkboxArrayKey") key: any;
    parent?: CheckboxArrayValueAccessor;
    state: boolean = false;

    constructor(private renderer: Renderer2, private element: ElementRef) {
    }

    writeValue(value: boolean) {
        this.state = value;
        this.renderer.setProperty(this.element.nativeElement, "checked", value);
    }

    onChange(value: boolean) {
        this.state = value;
        this.parent?.onChange();
    }

    onTouched() {
        this.parent?.onTouched();
    }

    setDisabledState(isDisabled: boolean) {
        this.renderer.setProperty(this.element.nativeElement, "disabled", isDisabled)
    }
}

export const CHECKBOX_ARRAY_VALUE_ACCESSOR: any = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxArrayValueAccessor),
    multi: true
}

@Directive({
    selector: '[checkboxArray][formControlName], [checkboxArray][formControl], [checkboxArray][ngModel]',
    providers: [CHECKBOX_ARRAY_VALUE_ACCESSOR],
    standalone: false

})
export class CheckboxArrayValueAccessor implements ControlValueAccessor, AfterContentInit, OnDestroy {
    @ContentChildren(CheckboxArrayKey, {descendants: true}) checkboxes?: QueryList<CheckboxArrayKey>;

    private state: any[] = [];
    private destroy = new Subject<void>();
    private onWriteValue = new Subject<void>();
    private _onChange = (_: any) => {};
    private _onTouched = () => {};

    ngAfterContentInit() {
        // Checkboxes will be defined by now - the if is a hack to resolve the potential undefined state
        if (this.checkboxes) {
            merge(of(0), this.checkboxes.changes, this.onWriteValue).pipe(
                takeUntil(this.destroy),
            ).subscribe({ next: () => {
                this.linkChildren();
            }});
        }
    }

    private linkChildren() {
        var me = this;
        var lastState = this.state;

        this.checkboxes?.forEach(chk => {
            chk.writeValue(lastState.indexOf(chk.key) > -1);
            chk.parent = me;
        });

        //Hack to avoid changes after a change detection cycle
        Promise.resolve(null).then(() => this.onChange());
    }

    writeValue(obj: any): void {
        if (Array.isArray(obj)) {
            this.state = obj;
            this.onWriteValue.next();
        }
    }

    registerOnChange(fn: (_: any) => void): void {
        this._onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this._onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.checkboxes?.forEach(chk => chk.setDisabledState(isDisabled));
    }

    onChange() {
        this._onChange(this.checkboxes?.filter(chk => chk.state).map(chk => chk.key) || []);
    }

    onTouched() {
        this._onTouched();
    }

    ngOnDestroy(): void {
        this.destroy.next();
        this.destroy.complete();
        this.onWriteValue.complete();
    }
}
