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
import { of } from 'rxjs';
import { FormControl, FormGroup } from '@angular/forms';
import { ServizioInfoFormComponent } from './servizio-info-form.component';

describe('ServizioInfoFormComponent', () => {
  let component: ServizioInfoFormComponent;
  let mockApiService: any;

  const _anac = { id_organizzazione: 'o-anac', nome: 'ANAC', intermediata: true };

  beforeEach(() => {
    mockApiService = { getList: vi.fn() };
    const mockConfigService = { getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: '' } } }) } as any;
    const mockAuthenticationService = { _getConfigModule: vi.fn().mockReturnValue({}), canEditField: vi.fn().mockReturnValue(true) } as any;
    component = new ServizioInfoFormComponent({} as any, mockConfigService, mockApiService, {} as any, mockAuthenticationService);
    component._formGroup = new FormGroup({ id_soggetto_erogatore: new FormControl(null) });
    component._isFruizione = true;
  });

  describe('_loadCurrentSoggetti (Issue #374)', () => {
    it('should not filter on referente and show the saved soggetto of an intermediata org', () => {
      component.data = { soggetto_erogatore: { id_soggetto: 's-att', nome: 'ANAC-ATTESTAZIONE', organizzazione: _anac } };
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's-anac' }, { id_soggetto: 's-att' }] }));

      (component as any)._loadCurrentSoggetti();

      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { id_organizzazione: 'o-anac' } });
      expect(component._hideSoggettoInfo).toBe(false);
      expect(component._formGroup.get('id_soggetto_erogatore')?.value).toBe('s-att');
    });

    it('should keep the saved soggetto when it is not among the proposed ones', () => {
      component.data = { soggetto_erogatore: { id_soggetto: 's-att', nome: 'ANAC-ATTESTAZIONE', organizzazione: _anac } };
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's-anac' }] }));

      (component as any)._loadCurrentSoggetti();

      expect(component._formGroup.get('id_soggetto_erogatore')?.value).toBe('s-att');
      expect(component._hideSoggettoInfo).toBe(false);
    });

    it('should still filter on referente for a non intermediata org', () => {
      const _org = { id_organizzazione: 'o-rt', nome: 'Regione Toscana', intermediata: false };
      component.data = { soggetto_erogatore: { id_soggetto: 's-rt', organizzazione: _org } };
      mockApiService.getList.mockReturnValue(of({ content: [{ id_soggetto: 's-rt' }] }));

      (component as any)._loadCurrentSoggetti();

      expect(mockApiService.getList).toHaveBeenCalledWith('soggetti', { params: { id_organizzazione: 'o-rt', referente: true } });
      expect(component._hideSoggettoInfo).toBe(true);
    });
  });
  describe('opzioni di adesione imposte dal dominio (Issue #382)', () => {
    beforeEach(() => {
      component._formGroup = new FormGroup({
        multi_adesione: new FormControl(false),
        adesione_disabilitata: new FormControl(false)
      });
      component._hasFlagConsentiNonSottoscrivibile = true;
    });

    it('should lock multi adesione and, being exclusive, disabled subscription', () => {
      component._setAdesioneDominio({ multi_adesione: true });
      expect(component._formGroup.getRawValue()).toEqual({ multi_adesione: true, adesione_disabilitata: false });
      expect(component._formGroup.get('multi_adesione')?.disabled).toBe(true);
      expect(component._formGroup.get('adesione_disabilitata')?.disabled).toBe(true);
    });

    it('should follow the state permissions when the domain does not impose the option', () => {
      (component as any).authenticationService.canEditField.mockReturnValue(false);
      component._setAdesioneDominio({ multi_adesione: false });
      expect(component._formGroup.get('multi_adesione')?.disabled).toBe(true);
    });
  });
});
