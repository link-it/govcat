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
import { ErogatoreLabelPipe } from './erogatore-label.pipe';

describe('ErogatoreLabelPipe', () => {
  const pipe = new ErogatoreLabelPipe();

  it('should return empty string without soggetto', () => {
    expect(pipe.transform(null)).toBe('');
  });

  it('should return the organization when it has a single soggetto', () => {
    expect(pipe.transform({ nome: 'RegioneToscana', organizzazione: { nome: 'Regione Toscana', multi_soggetto: false } })).toBe('Regione Toscana');
  });

  it('should add the soggetto when the organization has more than one', () => {
    expect(pipe.transform({ nome: 'ANAC-ATTESTAZIONE', organizzazione: { nome: 'ANAC', multi_soggetto: true } })).toBe('ANAC (ANAC-ATTESTAZIONE)');
  });

  it('should fall back to the soggetto name without organization', () => {
    expect(pipe.transform({ nome: 'ANAC' })).toBe('ANAC');
  });
});
