import { Directive, ElementRef, HostListener, Input, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive that automatically trims whitespace from the beginning and end
 * of input field values when the field loses focus (blur event).
 *
 * If the trimmed value is empty, it sets the value to null to ensure
 * the backend receives null instead of empty strings or whitespace.
 *
 * This helps prevent users from accidentally submitting forms with
 * leading/trailing spaces in text fields.
 *
 * @example
 * // Basic usage - trims on blur, converts empty to null
 * <input type="text" appTrimOnBlur formControlName="nome">
 *
 * // Disable trimming conditionally
 * <input type="text" [appTrimOnBlur]="false" formControlName="nome">
 */
@Directive({
  selector: '[appTrimOnBlur]',
  standalone: false
})
export class TrimOnBlurDirective {
  @Input('appTrimOnBlur') isEnabled: boolean | '' = true;

  constructor(
    private el: ElementRef,
    @Optional() @Self() private ngControl: NgControl
  ) {}

  @HostListener('blur', ['$event'])
  onBlur(event: FocusEvent): void {
    // Handle both boolean true and empty string '' (when used as attribute without value)
    if (this.isEnabled === false) {
      return;
    }

    const input = this.el.nativeElement as HTMLInputElement | HTMLTextAreaElement;

    if (typeof input.value === 'string') {
      const trimmedValue = input.value.trim();
      // Convert empty string to null for backend
      const finalValue = trimmedValue.length > 0 ? trimmedValue : null;

      if (finalValue !== input.value) {
        // Update the DOM element value (empty string for null since input can't show null)
        input.value = finalValue || '';

        // If using reactive forms, update the form control value
        if (this.ngControl && this.ngControl.control) {
          this.ngControl.control.setValue(finalValue, { emitEvent: true });
        }

        // Dispatch input event to trigger any other listeners
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}
