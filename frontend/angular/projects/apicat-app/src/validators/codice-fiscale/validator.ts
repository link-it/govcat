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

export const cf = (): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {

    function validaCodiceFiscale(cf: string) {
      var validi, i, s, set1, set2, setpari, setdisp;
      if (cf == '') return '';
      cf = cf.toUpperCase();
      if (cf.length != 16)
        return false;
      validi = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      for (i = 0; i < 16; i++) {
        if (validi.indexOf(cf.charAt(i)) == -1)
          return false;
      }
      set1 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      set2 = "ABCDEFGHIJABCDEFGHIJKLMNOPQRSTUVWXYZ";
      setpari = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      setdisp = "BAKPLCQDREVOSFTGUHMINJWZYX";
      s = 0;
      for (i = 1; i <= 13; i += 2)
        s += setpari.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
      for (i = 0; i <= 14; i += 2)
        s += setdisp.indexOf(set2.charAt(set1.indexOf(cf.charAt(i))));
      if (s % 26 != cf.charCodeAt(15) - 'A'.charCodeAt(0))
        return false;
      return true;
    }

    if (isPresent(Validators.required(control))) {
      return null;
    }

    const v: string = control.value;
    return validaCodiceFiscale(v) ? null : { 'cf': true };
  };
};
