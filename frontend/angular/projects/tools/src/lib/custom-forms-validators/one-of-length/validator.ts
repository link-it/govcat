import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../util/lang';

export const oneOfLength = (includedInArr: Array<any>): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!isPresent(includedInArr)) {
      return null;
    }
    if (isPresent(Validators.required(control))) {
      return null;
    }

    const v: string = control.value;

    if (includedInArr.indexOf(v.length) < 0) {
      return { oneOfLength: {value: control.value, reason: includedInArr}};
    }
    return null;
  };
};
