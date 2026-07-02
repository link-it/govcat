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
import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, take } from 'rxjs/operators';

/**
 * Issue #271 — Validator asincrono che verifica se esiste gia` un
 * dominio con lo stesso nome (eventualmente associato a un'altra
 * organizzazione, invisibile all'AMM_ORG corrente).
 *
 * Endpoint BE: `GET /domini/exists?nome={value}` → `{ exists: boolean }`.
 *
 * Comportamento:
 * - Se il valore e` vuoto: ritorna `null` (la `required` resta gestita
 *   dal sync validator standard).
 * - Se il valore corrisponde a `originalName` (mode edit, nome non
 *   cambiato): ritorna `null`, perche` il dominio in modifica e`
 *   ovviamente "gia` esistente" sul DB.
 * - `timer(400)` agisce come debounce naturale: Angular cancella la
 *   sottoscrizione del validator precedente quando il control cambia
 *   di nuovo, quindi la richiesta HTTP non parte se l'utente sta
 *   ancora digitando.
 * - `catchError → of(null)` per evitare di bloccare l'invio del form
 *   in caso di errore di rete sul check pre-validazione. L'errore
 *   server-side al salvataggio resta gestito come fallback dal BE.
 *
 * Restituisce `{ alreadyExists: true }` quando il BE indica
 * `exists === true`.
 */
export function dominioExistsValidator(
  apiService: { getList: (name: string, options?: any) => Observable<any> },
  originalName: string = ''
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const value = (control.value ?? '').toString().trim();
    if (!value) {
      return of(null);
    }
    if (originalName && value === originalName.trim()) {
      return of(null);
    }

    return timer(400).pipe(
      switchMap(() => apiService.getList('domini/exists', { params: { nome: value } })),
      map((resp: any) => (resp?.exists ? { alreadyExists: true } : null)),
      catchError((err: any) => {
        // Fail-open: errore di rete o endpoint non disponibile non
        // deve bloccare il flow di submit (il BE sara` il fallback
        // di verita`). Loggato per facilitare la diagnosi quando
        // il messaggio inline non scatta come atteso.
        // eslint-disable-next-line no-console
        console.warn('[dominioExistsValidator] check failed (fail-open):', err?.status ?? err);
        return of(null);
      }),
      take(1)
    );
  };
}
