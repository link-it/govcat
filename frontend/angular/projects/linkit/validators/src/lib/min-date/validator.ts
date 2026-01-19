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
import { AbstractControl, FormControl, NgModel, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isDate, isPresent, parseDate } from '../util/lang';

export const minDate = (minInput: any): ValidatorFn => {
  let value;
  let subscribe = false;
  let minValue = minInput;
  const isForm = minInput instanceof FormControl || minInput instanceof NgModel;
  return (control: AbstractControl): ValidationErrors | null => {

    if (!subscribe && isForm) {
      subscribe = true;
      minInput.valueChanges?.subscribe(() => {
        control.updateValueAndValidity();
      });
    }

    if (isForm) {
      minValue = minInput.value;
    }

    value = parseDate(minValue) as any;

    if (!isDate(value) && !(value instanceof Function)) {
      if (value == null) {
        return null;
      } else if (isForm) {
        return { minDate: { error: 'minDate is invalid' } };
      } else {
        throw Error('minDate value must be or return a formatted date');
      }
    }

    if (isPresent(Validators.required(control))) {
      return null;
    }

    const d = new Date(parseDate(control.value)).getTime();

    if (!isDate(d)) {
      return { value: true };
    }
    if (value instanceof Function) {
      value = value();
    }

    return d >= new Date(value).getTime()
      ? null
      : (isForm ? { minDate: { control: minInput, value: minInput.value } } : { minDate: { value: minValue, control: undefined } });
  };
};
