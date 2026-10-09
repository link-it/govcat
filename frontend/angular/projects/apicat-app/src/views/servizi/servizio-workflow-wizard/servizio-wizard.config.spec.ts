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
import { nomeApiDaServizio } from './servizio-wizard.config';

describe('nomeApiDaServizio', () => {
  it('should lowercase and join words with dashes', () => {
    expect(nomeApiDaServizio('Anagrafe Celiaci')).toBe('anagrafe-celiaci');
  });

  it('should remove accents and collapse separators', () => {
    expect(nomeApiDaServizio('  Servizio   Verifica Società / Città v2 ')).toBe('servizio-verifica-societa-citta-v2');
  });

  it('should keep only letters and digits', () => {
    expect(nomeApiDaServizio('C008-servizioVerificaDichResidenza')).toBe('c008-servizioverificadichresidenza');
  });

  it('should return an empty string without a name', () => {
    expect(nomeApiDaServizio(null)).toBe('');
    expect(nomeApiDaServizio('---')).toBe('');
  });

  it('should be at most 255 characters', () => {
    expect(nomeApiDaServizio('a'.repeat(300)).length).toBe(255);
  });
});
