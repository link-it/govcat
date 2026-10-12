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
import { of, throwError } from 'rxjs';
import { disclaimersDelGruppo, disclaimersDelleProprieta, loadServizioDisclaimers, normalizeServizioDisclaimers } from './servizio-disclaimers';

describe('servizio-disclaimers', () => {
  const list: any[] = [
    { disclaimer: 'gen', contesto: 'generale', nome_gruppo: 'PDNDCollaudo' },
    { disclaimer: 'col', contesto: 'collaudo', nome_gruppo: 'PDNDCollaudo', severity: 'WARNING' },
    { disclaimer: 'prod', contesto: 'produzione', nome_gruppo: 'PDNDCollaudo' },
    { disclaimer: 'altro', contesto: 'collaudo', nome_gruppo: 'Altro' },
    { disclaimer: 'banner', contesto: 'collaudo' }
  ];

  it('should normalize the response dropping empty entries', () => {
    expect(normalizeServizioDisclaimers(null)).toEqual([]);
    expect(normalizeServizioDisclaimers([{ disclaimer: '' }, { disclaimer: 'x', nome_gruppo: 'g', links: [] }])).toEqual([
      { disclaimer: 'x', contesto: undefined, severity: undefined, profilo: undefined, nome_gruppo: 'g' }
    ]);
  });

  it('should keep the group disclaimers of the same environment or general', () => {
    expect(disclaimersDelGruppo(list, 'PDNDCollaudo', 'collaudo').map(d => d.disclaimer)).toEqual(['gen', 'col']);
    expect(disclaimersDelGruppo(list, 'PDNDCollaudo', 'produzione').map(d => d.disclaimer)).toEqual(['gen', 'prod']);
    expect(disclaimersDelGruppo(list, 'PDNDCollaudo', 'generico').map(d => d.disclaimer)).toEqual(['gen']);
    expect(disclaimersDelGruppo(list, null, 'collaudo')).toEqual([]);
  });

  it('should collect the disclaimers of all the groups under a label, without duplicates', () => {
    const proprieta = [
      { nome_gruppo: 'PDNDCollaudo', classe_dato: 'collaudo' },
      { nome_gruppo: 'PDNDCollaudo', classe_dato: 'collaudo' },
      { nome_gruppo: 'Altro', classe_dato: 'collaudo' }
    ];
    expect(disclaimersDelleProprieta(list, proprieta).map(d => d.disclaimer)).toEqual(['gen', 'col', 'altro']);
    expect(disclaimersDelleProprieta(list, proprieta, 'produzione').map(d => d.disclaimer)).toEqual(['gen', 'prod']);
  });

  it('should load the disclaimers in the current language and swallow errors', async () => {
    const api: any = { getDetails: vi.fn().mockReturnValue(of([{ disclaimer: 'x' }])) };
    const translate: any = { currentLang: 'en', getDefaultLang: () => 'it' };
    const result = await new Promise(resolve => loadServizioDisclaimers(api, translate, 's1').subscribe(resolve));
    expect(api.getDetails).toHaveBeenCalledWith('servizi', 's1', 'disclaimers', { params: { language_code: 'en' } });
    expect((result as any[]).length).toBe(1);

    api.getDetails.mockReturnValue(throwError(() => new Error('ko')));
    const empty = await new Promise(resolve => loadServizioDisclaimers(api, translate, 's1').subscribe(resolve));
    expect(empty).toEqual([]);
  });
});
