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
import { ServizioReferenteAddFormComponent } from './servizio-referente-add-form.component';
import { RUOLI_ORG_REFERENTE } from '@app/services/utils.service';

describe('ServizioReferenteAddFormComponent', () => {
  let component: ServizioReferenteAddFormComponent;
  let mockUtils: any;

  beforeEach(() => {
    mockUtils = { getUtenti: vi.fn().mockReturnValue(of([{ id_utente: 'u1', nome: 'Mario', cognome: 'Rossi' }])) };
    component = new ServizioReferenteAddFormComponent({} as any, mockUtils);
    component.idOrganizzazione = 'org1';
    component.ngOnInit();
  });

  it('should preselect the "referente" type with the users already loaded', async () => {
    expect(component._formGroup.get('tipo')?.value).toBe('referente');
    expect(component._formGroup.get('id_utente')?.enabled).toBe(true);
    expect(mockUtils.getUtenti).toHaveBeenCalledWith('', null, 'abilitato', 'org1', RUOLI_ORG_REFERENTE);
    expect(await firstValueFrom(component.referenti$)).toEqual([{ id_utente: 'u1', nome: 'Mario', cognome: 'Rossi' }]);
  });

  it('should reload the users when the type changes', () => {
    mockUtils.getUtenti.mockClear();
    component._formGroup.get('tipo')?.setValue('referente_tecnico');
    component.onChangeTipo(null);
    expect(component._formGroup.get('id_utente')?.value).toBeNull();
    expect(mockUtils.getUtenti).toHaveBeenCalledTimes(1);
  });
});
