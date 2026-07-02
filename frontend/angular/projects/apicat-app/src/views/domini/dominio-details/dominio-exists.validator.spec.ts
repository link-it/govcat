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
import { describe, it, expect, vi } from 'vitest';
import { FormControl } from '@angular/forms';
import { firstValueFrom, of, throwError, Observable } from 'rxjs';

import { dominioExistsValidator } from './dominio-exists.validator';

describe('dominioExistsValidator', () => {

  const makeApi = (resp: any, throwErr: boolean = false) => ({
    getList: vi.fn().mockImplementation((): Observable<any> =>
      throwErr ? throwError(() => new Error('boom')) : of(resp)
    )
  });

  it('returns null when value is empty', async () => {
    const api = makeApi({ exists: true });
    const validator = dominioExistsValidator(api);
    const result = await firstValueFrom(validator(new FormControl('')) as Observable<any>);
    expect(result).toBeNull();
    expect(api.getList).not.toHaveBeenCalled();
  });

  it('returns null when value matches originalName (no change in edit)', async () => {
    const api = makeApi({ exists: true });
    const validator = dominioExistsValidator(api, 'MyDomain');
    const result = await firstValueFrom(validator(new FormControl('MyDomain')) as Observable<any>);
    expect(result).toBeNull();
    expect(api.getList).not.toHaveBeenCalled();
  });

  it('returns null when value matches originalName ignoring surrounding whitespace', async () => {
    const api = makeApi({ exists: true });
    const validator = dominioExistsValidator(api, '  MyDomain  ');
    const result = await firstValueFrom(validator(new FormControl('MyDomain')) as Observable<any>);
    expect(result).toBeNull();
    expect(api.getList).not.toHaveBeenCalled();
  });

  it('returns { alreadyExists: true } when BE reports exists', async () => {
    const api = makeApi({ exists: true });
    const validator = dominioExistsValidator(api, '');
    const result = await firstValueFrom(validator(new FormControl('NewName')) as Observable<any>);
    expect(result).toEqual({ alreadyExists: true });
    expect(api.getList).toHaveBeenCalledWith('domini/exists', { params: { nome: 'NewName' } });
  });

  it('returns null when BE reports !exists', async () => {
    const api = makeApi({ exists: false });
    const validator = dominioExistsValidator(api, '');
    const result = await firstValueFrom(validator(new FormControl('NewName')) as Observable<any>);
    expect(result).toBeNull();
  });

  it('returns null when BE returns no exists field', async () => {
    const api = makeApi({});
    const validator = dominioExistsValidator(api, '');
    const result = await firstValueFrom(validator(new FormControl('NewName')) as Observable<any>);
    expect(result).toBeNull();
  });

  it('returns null on HTTP error (fail-open)', async () => {
    const api = makeApi(null, true);
    const validator = dominioExistsValidator(api, '');
    const result = await firstValueFrom(validator(new FormControl('NewName')) as Observable<any>);
    expect(result).toBeNull();
  });

  it('passes trimmed value to API', async () => {
    const api = makeApi({ exists: false });
    const validator = dominioExistsValidator(api, '');
    await firstValueFrom(validator(new FormControl('  Padded  ')) as Observable<any>);
    expect(api.getList).toHaveBeenCalledWith('domini/exists', { params: { nome: 'Padded' } });
  });

  it('handles null control value gracefully', async () => {
    const api = makeApi({ exists: true });
    const validator = dominioExistsValidator(api);
    const result = await firstValueFrom(validator(new FormControl(null)) as Observable<any>);
    expect(result).toBeNull();
    expect(api.getList).not.toHaveBeenCalled();
  });
});
