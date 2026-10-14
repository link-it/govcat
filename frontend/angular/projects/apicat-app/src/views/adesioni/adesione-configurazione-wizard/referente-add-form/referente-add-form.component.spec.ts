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
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { ReferenteAddFormComponent } from './referente-add-form.component';
import { RUOLI_ORG_REFERENTE } from '@app/services/utils.service';

describe('ReferenteAddFormComponent', () => {
  let component: ReferenteAddFormComponent;
  let mockApi: any;

  beforeEach(() => {
    mockApi = { getList: vi.fn().mockReturnValue(of({ content: [{ id_utente: 'u1', nome: 'Mario', cognome: 'Rossi' }] })) };
    component = new ReferenteAddFormComponent(mockApi, {} as any);
    component.adesione = { soggetto: { organizzazione: { id_organizzazione: 'org1' } } };
    component.ngOnInit();
  });

  it('should preselect the "referente" type with the user field enabled', () => {
    expect(component.formGroup.get('tipo')?.value).toBe('referente');
    expect(component.referentiTipo).toBe('referente');
    expect(component.formGroup.get('id_utente')?.enabled).toBe(true);
  });

  it('should load the selectable users also without a search term', async () => {
    const result = await firstValueFrom(component.getSearchUtente()(''));
    expect(mockApi.getList).toHaveBeenCalledWith('utenti', { params: { q: '', stato: 'abilitato', id_organizzazione: 'org1', ruolo_organizzazione: RUOLI_ORG_REFERENTE } });
    expect(result).toEqual([{ label: 'Mario Rossi', value: 'u1' }]);
  });
});
