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
import { describe, it, expect, beforeEach } from 'vitest';
import { ServizioApiUrlAggiuntiveComponent } from './servizio-api-url-aggiuntive.component';
import { creaUrlAggiuntiveFormArray } from '../../servizio-api-url-aggiuntive';

describe('ServizioApiUrlAggiuntiveComponent', () => {
  let component: ServizioApiUrlAggiuntiveComponent;

  beforeEach(() => {
    component = new ServizioApiUrlAggiuntiveComponent();
    component.urlArray = creaUrlAggiuntiveFormArray([{ etichetta: 'A' }, { etichetta: 'B' }]);
  });

  const _etichette = () => component._righe.map((riga) => riga.get('etichetta')?.value);

  it('should add, move and remove rows', () => {
    component._aggiungi();
    expect(component._righe.length).toBe(3);
    component._sposta(1, -1);
    expect(_etichette()).toEqual(['B', 'A', null]);
    component._sposta(0, -1);
    expect(_etichette()).toEqual(['B', 'A', null]);
    component._rimuovi(2);
    expect(_etichette()).toEqual(['B', 'A']);
    expect(component.urlArray?.dirty).toBe(true);
  });

  it('should disable the rows when not editable, so they are not sent', () => {
    component.editable = false;
    component.ngOnChanges();
    expect(component.urlArray?.disabled).toBe(true);
    expect(component._canAdd).toBe(false);
    component.editable = true;
    component.ngOnChanges();
    expect(component.urlArray?.enabled).toBe(true);
  });

  it('should not add rows over the limit', () => {
    component.urlArray = creaUrlAggiuntiveFormArray(Array.from({ length: component.MAX }, (_v, i) => ({ etichetta: `U${i}` })));
    expect(component._canAdd).toBe(false);
    component._aggiungi();
    expect(component._righe.length).toBe(component.MAX);
  });

  it('should report duplicated labels per row', () => {
    component.urlArray = creaUrlAggiuntiveFormArray([{ etichetta: 'A' }, { etichetta: 'a' }]);
    expect(component._isDuplicata(0)).toBe(false);
    expect(component._isDuplicata(1)).toBe(true);
  });
});
