import { Component, Input } from "@angular/core";
import { AbstractControl } from "@angular/forms";

@Component({
  selector: "lnk-form-field-error",
  templateUrl: "./form-field-error.component.html",
  standalone: false
})
export class LnkFormFieldErrorComponent {
  @Input() control: AbstractControl | null = null;
}
