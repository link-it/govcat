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

/** Lunghezza massima dell'identificativo logico (String255 del backend). */
export const ID_LOGICO_MAX = 255;

/** Obbligatorio anche contro i valori fatti di soli spazi. */
const nonVuoto: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
  `${control.value ?? ''}`.trim() ? null : { required: true };

/** Validatori dell'identificativo logico: obbligatorio solo per i servizi multi-adesione. */
export function validatoriIdLogico(obbligatorio: boolean): ValidatorFn[] {
  return obbligatorio ? [nonVuoto, Validators.maxLength(ID_LOGICO_MAX)] : [Validators.maxLength(ID_LOGICO_MAX)];
}

/** Valore da inviare: senza spazi ai lati, `null` se vuoto. */
export function normalizzaIdLogico(valore: any): string | null {
  const _valore = `${valore ?? ''}`.trim();
  return _valore || null;
}

/** Adesione a un servizio multi-adesione senza identificativo logico (dati precedenti al flag). */
export function idLogicoMancante(adesione: any): boolean {
  return !!adesione?.servizio?.multi_adesione && !normalizzaIdLogico(adesione?.id_logico);
}
