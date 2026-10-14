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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Tools } from '@linkit/components';
import { ServizioAllegatoAddFormComponent } from './servizio-allegato-add-form.component';

describe('ServizioAllegatoAddFormComponent', () => {
  let component: ServizioAllegatoAddFormComponent;
  let mockAuthenticationService: any;
  let savedConfigurazione: any;

  const createComponent = (visibilita: string[], gestore: boolean) => {
    Tools.Configurazione = { servizio: { visibilita_allegati_consentite: visibilita } } as any;
    mockAuthenticationService = { isGestore: vi.fn().mockReturnValue(gestore) };
    component = new ServizioAllegatoAddFormComponent({} as any, mockAuthenticationService);
    component.ngOnInit();
  };

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should offer only the generic and data sheet roles', () => {
    createComponent(['gestore', 'servizio', 'pubblico'], true);
    expect(component.tipiAllegati.map((t: any) => t.value)).toEqual(['generico', 'specifica']);
  });

  it('should default the role to generic', () => {
    createComponent(['gestore', 'servizio', 'pubblico'], true);
    expect(component.f['tipologia'].value).toBe('generico');
  });

  it('should order visibility as pubblico, servizio, gestore and default to pubblico', () => {
    createComponent(['gestore', 'servizio', 'pubblico'], true);
    expect(component.tipiVisibilitaAllegato.map((v: any) => v.value)).toEqual(['pubblico', 'servizio', 'gestore']);
    expect(component.f['visibilita'].value).toBe('pubblico');
  });

  it('should keep other values between servizio and gestore and hide gestore to non gestori', () => {
    createComponent(['gestore', 'adesione', 'servizio', 'pubblico'], false);
    expect(component.tipiVisibilitaAllegato.map((v: any) => v.value)).toEqual(['pubblico', 'servizio', 'adesione']);
  });

  it('should not preselect visibility when pubblico is not allowed', () => {
    createComponent(['gestore', 'servizio'], true);
    expect(component.f['visibilita'].value).toBeNull();
  });

  describe('tipologie in base al grant', () => {
    const _crea = (scrivibili: string[]) => {
      Tools.Configurazione = { servizio: { visibilita_allegati_consentite: ['pubblico'] } } as any;
      mockAuthenticationService = { isGestore: vi.fn().mockReturnValue(false), tipologieAllegatoScrivibili: vi.fn().mockReturnValue(scrivibili) };
      component = new ServizioAllegatoAddFormComponent({} as any, mockAuthenticationService);
      component.grant = { ruoli: ['referente'] } as any;
      component.ngOnInit();
    };

    it('should offer only the attachment types the user can write', () => {
      _crea(['specifica']);
      expect(component.tipiAllegati.map((t: any) => t.value)).toEqual(['specifica']);
      expect(component.f['tipologia'].value).toBe('specifica');
    });

    it('should default to the generic type when allowed', () => {
      _crea(['generico', 'specifica']);
      expect(component.tipiAllegati.map((t: any) => t.value)).toEqual(['generico', 'specifica']);
      expect(component.f['tipologia'].value).toBe('generico');
    });
  });
});
