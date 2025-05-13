import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../util/lang';

export const url: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (isPresent(Validators.required(control))) {
    return null;
  }

  const v: string = control.value;
  try {
    new URL(v);
    return null;
  } catch (_) {
    return { 'url': true };
  }
};
