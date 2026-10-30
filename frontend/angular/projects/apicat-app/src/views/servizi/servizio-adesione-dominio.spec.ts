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
import { FormControl, FormGroup } from '@angular/forms';
import { adesioneBloccataDalDominio, adesioneImpostaDalDominio, applicaAdesioneDominio } from './servizio-adesione-dominio';

describe('servizio-adesione-dominio', () => {
  it('should read the options imposed by the domain', () => {
    expect(adesioneImpostaDalDominio({ multi_adesione: true, adesione_disabilitata: true }, true)).toEqual({ multi: true, disabilitata: true });
    expect(adesioneImpostaDalDominio({ adesione_disabilitata: true }, false)).toEqual({ multi: false, disabilitata: false });
    expect(adesioneImpostaDalDominio(null, true)).toEqual({ multi: false, disabilitata: false });
  });

  it('should lock the opposite option only when exclusive', () => {
    expect(adesioneBloccataDalDominio({ multi: true, disabilitata: false }, true)).toEqual({ multi: true, disabilitata: true });
    expect(adesioneBloccataDalDominio({ multi: true, disabilitata: false }, false)).toEqual({ multi: true, disabilitata: false });
  });

  it('should set and disable the locked controls', () => {
    const form = new FormGroup({ multi_adesione: new FormControl(false), adesione_disabilitata: new FormControl(true) });
    applicaAdesioneDominio(form, { multi: true, disabilitata: false }, true);
    expect(form.getRawValue()).toEqual({ multi_adesione: true, adesione_disabilitata: false });
    expect(form.get('multi_adesione')?.disabled).toBe(true);
    expect(form.get('adesione_disabilitata')?.disabled).toBe(true);
  });

  it('should leave free controls untouched', () => {
    const form = new FormGroup({ multi_adesione: new FormControl(true), adesione_disabilitata: new FormControl(false) });
    applicaAdesioneDominio(form, { multi: false, disabilitata: false }, true);
    expect(form.get('multi_adesione')?.enabled).toBe(true);
    expect(form.get('multi_adesione')?.value).toBe(true);
  });
});
