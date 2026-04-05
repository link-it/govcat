import { describe, it, expect, beforeEach } from 'vitest';
import { FormControl, Validators } from '@angular/forms';
import { LnkFormFieldErrorComponent } from './form-field-error.component';

describe('LnkFormFieldErrorComponent', () => {
  let component: LnkFormFieldErrorComponent;

  beforeEach(() => {
    component = new LnkFormFieldErrorComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have null control by default', () => {
    expect(component.control).toBeNull();
  });

  it('should accept a FormControl', () => {
    const control = new FormControl('', Validators.required);
    component.control = control;
    expect(component.control).toBe(control);
  });

  it('should reflect control errors', () => {
    const control = new FormControl('', Validators.required);
    control.markAsTouched();
    component.control = control;
    expect(component.control.errors).toEqual({ required: true });
  });
});
