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
import { describe, it, expect } from 'vitest';
import { MAX_URL_AGGIUNTIVE, creaRigaUrlAggiuntiva, creaUrlAggiuntiveFormArray, urlAggiuntiveDaForm } from './servizio-api-url-aggiuntive';

describe('servizio-api-url-aggiuntive', () => {
  it('should build the rows from the saved configuration', () => {
    const _array = creaUrlAggiuntiveFormArray([{ etichetta: 'Internet', url_prefix_produzione: 'https://ext' }]);
    expect(_array.length).toBe(1);
    expect(_array.at(0).value).toEqual({ etichetta: 'Internet', template_url: null, url_prefix_collaudo: null, url_prefix_produzione: 'https://ext' });
  });

  it('should require the label', () => {
    const _array = creaUrlAggiuntiveFormArray([{ etichetta: '' }]);
    expect(_array.at(0).get('etichetta')?.errors?.['required']).toBe(true);
    expect(_array.valid).toBe(false);
  });

  it('should flag duplicated labels ignoring case and spaces', () => {
    const _array = creaUrlAggiuntiveFormArray([{ etichetta: 'Internet' }, { etichetta: 'Rete' }, { etichetta: ' internet ' }]);
    expect(_array.errors?.['etichettaDuplicata']).toEqual([2]);
    _array.at(2).get('etichetta')?.setValue('DMZ');
    expect(_array.errors).toBeNull();
  });

  it('should limit the number of rows', () => {
    const _array = creaUrlAggiuntiveFormArray(Array.from({ length: MAX_URL_AGGIUNTIVE }, (_v, i) => ({ etichetta: `U${i}` })));
    expect(_array.errors).toBeNull();
    _array.push(creaRigaUrlAggiuntiva({ etichetta: 'Extra' }));
    expect(_array.errors?.['maxUrlAggiuntive']).toEqual({ max: MAX_URL_AGGIUNTIVE });
  });

  it('should trim the values and send empty optional fields as null', () => {
    expect(urlAggiuntiveDaForm([{ etichetta: ' Internet ', template_url: '  ', url_prefix_collaudo: ' https://c ', url_prefix_produzione: null }])).toEqual([
      { etichetta: 'Internet', template_url: null, url_prefix_collaudo: 'https://c', url_prefix_produzione: null }
    ]);
    expect(urlAggiuntiveDaForm(undefined)).toEqual([]);
  });
});
