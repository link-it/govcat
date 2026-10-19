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

  describe('opzione di visibilita componente', () => {
    const hasComponente = () => component._tipiVisibilitaServizio.some((t: any) => t.value === 'componente');

    beforeEach(() => {
      (component as any).authenticationService.isGestore = vi.fn().mockReturnValue(true);
    });

    it('should follow the package flag, keeping it for a service that already is a component', () => {
      component._showPackage = false;
      component.data = { visibilita: 'pubblico' };
      (component as any)._buildVisibilitaOptions();
      expect(hasComponente()).toBe(false);

      component.data = { visibilita: 'componente' };
      (component as any)._buildVisibilitaOptions();
      expect(hasComponente()).toBe(true);

      component._showPackage = true;
      component.data = { visibilita: 'pubblico' };
      (component as any)._buildVisibilitaOptions();
      expect(hasComponente()).toBe(true);
    });
  });

  describe('immagine nel payload di modifica', () => {
    const _immagineDelBody = () => (component as any)._prepareBodyUpdateServizio({ immagine: component._formGroup?.get('immagine')?.value }).dati_generici.immagine;

    beforeEach(() => {
      (component as any).authenticationService._removeDNM = vi.fn((_m: string, _s: string, body: any) => body);
      component._formGroup = new FormGroup({ immagine: new FormControl(null) });
    });

    it('should send null when the service has no image', () => {
      component.data = { id_servizio: 's1' };
      expect(_immagineDelBody()).toBeNull();
    });

    it('should keep the existing image by uuid', () => {
      component.data = { id_servizio: 's1', immagine: { uuid: 'u1' } };
      expect(_immagineDelBody()).toEqual({ tipo_documento: 'uuid', uuid: 'u1' });
    });

    it('should send null when the existing image is removed', () => {
      component.data = { id_servizio: 's1', immagine: { uuid: 'u1' } };
      component._onImageLoaded(null);
      expect(_immagineDelBody()).toBeNull();
    });

    it('should send the new image', () => {
      component.data = { id_servizio: 's1', immagine: { uuid: 'u1' } };
      component._onImageLoaded('data:image/png;base64,QUJD');
      expect(_immagineDelBody()).toEqual({ content_type: 'image/png', content: 'QUJD', tipo_documento: 'nuovo' });
    });
  });

  describe('_canCreateServizioMapper', () => {
    it('should delegate to canCreateServizio', () => {
      const auth: any = (component as any).authenticationService;
      auth.canCreateServizio = vi.fn().mockReturnValue(true);
      expect(component._canCreateServizioMapper()).toBe(true);
      auth.canCreateServizio.mockReturnValue(false);
      expect(component._canCreateServizioMapper()).toBe(false);
    });
  });

  describe('_enableDisableSkipCollaudo', () => {
    const _dominio = { skip_collaudo: true, soggetto_referente: { skip_collaudo: true } };

    beforeEach(() => {
      component._formGroup = new FormGroup({ skip_collaudo: new FormControl(true) });
    });

    it('should keep skip_collaudo editable in draft when the domain allows it', () => {
      component.data = { skip_collaudo: true, stato: 'bozza', dominio: _dominio };
      component._enableDisableSkipCollaudo(_dominio);
      expect(component._formGroup.get('skip_collaudo')?.enabled).toBe(true);
      expect(component._motivoSkipCollaudo).toBeNull();
    });

    it('should lock skip_collaudo outside draft, on both paths', () => {
      component.data = { skip_collaudo: true, stato: 'in_configurazione_produzione_senza_collaudo', dominio: _dominio };
      component._enableDisableSkipCollaudo(_dominio);
      expect(component._motivoSkipCollaudo).toBe('APP.MESSAGE.SkipCollaudoNonModificabile');
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
      expect(component._formGroup.getRawValue().skip_collaudo).toBe(true);

      component._formGroup.get('skip_collaudo')?.enable();
      component._formGroup.get('skip_collaudo')?.setValue(false);
      component.data = { skip_collaudo: false, stato: 'pubblicato_collaudo', dominio: _dominio };
      component._enableDisableSkipCollaudo(_dominio);
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
      expect(component._formGroup.getRawValue().skip_collaudo).toBe(false);
    });

    it('should explain why the domain selected in the form does not allow skipping', () => {
      component.data = { skip_collaudo: false, stato: 'bozza', dominio: _dominio };
      component.selectedDominio = { skip_collaudo: false, soggetto_referente: { skip_collaudo: false } };
      component._enableDisableSkipCollaudo(component.selectedDominio);
      expect(component._formGroup.get('skip_collaudo')?.disabled).toBe(true);
      expect(component._motivoSkipCollaudo).toBe('APP.MESSAGE.SkipCollaudoSoggettoNonConsente');

      component.selectedDominio = null;
      expect(component._motivoSkipCollaudo).toBe('APP.MESSAGE.SkipCollaudoDominioDaSelezionare');
    });
  });
});
