import {Component, EventEmitter, Input, Output} from "@angular/core";

@Component({
    selector: "lnk-form-submit",
    templateUrl: "./submit.component.html",
})
export class LnkFormSubmitComponent {
    @Input() submitLabel: string = 'Submit';
    @Input() cancelLabel: string = 'Cancel';
    @Input() disabled: boolean = false;

    @Output() cancel = new EventEmitter<void>();

    onCancel() {
        this.cancel.emit();
    }
}
