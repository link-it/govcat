import { Component, Input } from "@angular/core";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "lnk-form-field-error",
  standalone: false,
  templateUrl: "./form-field-error.component.html",
})
export class LnkFormFieldErrorComponent {
  @Input() control: AbstractControl | null = null;
}
