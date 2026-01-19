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
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isPresent } from '../util/lang';

/**
 * Validator that checks if a string value is not composed only of whitespace characters.
 * This validator allows empty/null values (use Validators.required for that).
 * Returns { 'notOnlyWhitespace': true } if the value contains only whitespace.
 *
 * @example
 * // Using with FormControl
 * new FormControl('', [Validators.required, CustomValidators.notOnlyWhitespace])
 */
export const notOnlyWhitespace: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  // Skip validation for empty values (let Validators.required handle that)
  if (!isPresent(control.value) || control.value === '') {
    return null;
  }

  const value = typeof control.value === 'string' ? control.value : String(control.value);
  const trimmed = value.trim();

  return trimmed.length > 0 ? null : { 'notOnlyWhitespace': true };
};

/**
 * Validator that checks if a string value has no leading or trailing whitespace.
 * This validator allows empty/null values (use Validators.required for that).
 * Returns { 'noLeadingTrailingWhitespace': true } if the value has leading/trailing spaces.
 *
 * @example
 * // Using with FormControl
 * new FormControl('', [CustomValidators.noLeadingTrailingWhitespace])
 */
export const noLeadingTrailingWhitespace: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  // Skip validation for empty values
  if (!isPresent(control.value) || control.value === '') {
    return null;
  }

  const value = typeof control.value === 'string' ? control.value : String(control.value);
  const trimmed = value.trim();

  return value === trimmed ? null : { 'noLeadingTrailingWhitespace': true };
};
