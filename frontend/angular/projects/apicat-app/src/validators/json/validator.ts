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
import { AbstractControl, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { isPresent } from '../util/lang';

export const json: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  if (isPresent(Validators.required(control))) {
    return null;
  }

  const v: string = control.value;

  try {
    const obj = JSON.parse(v);

    if (Boolean(obj) && typeof obj === 'object') {
      return null;
    }
  } catch (e) { 
    console.error(e);
  }
  return { json: true };
};
