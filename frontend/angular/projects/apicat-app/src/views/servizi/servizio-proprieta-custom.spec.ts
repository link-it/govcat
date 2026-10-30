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
import { ambienteClasseDato, filtraGruppiPerRuoli, proprietaVisibilePerRuoli } from './servizio-proprieta-custom';

describe('servizio-proprieta-custom', () => {
  it('should apply the ruoli_abilitati rule', () => {
    expect(proprietaVisibilePerRuoli({}, ['referente'])).toBe(true);
    expect(proprietaVisibilePerRuoli({ ruoli_abilitati: null }, ['referente'])).toBe(true);
    expect(proprietaVisibilePerRuoli({ ruoli_abilitati: [] }, ['gestore'])).toBe(false);
    expect(proprietaVisibilePerRuoli({ ruoli_abilitati: ['gestore'] }, ['referente'])).toBe(false);
    expect(proprietaVisibilePerRuoli({ ruoli_abilitati: ['gestore', 'referente'] }, ['referente'])).toBe(true);
  });

  it('should drop the hidden fields and the groups left empty', () => {
    const gruppi: any = {
      A: [{ nome: 'a1' }, { nome: 'a2', ruoli_abilitati: ['gestore'] }],
      B: [{ nome: 'b1', ruoli_abilitati: ['gestore'] }]
    };
    const result = filtraGruppiPerRuoli(gruppi, ['referente']);
    expect(Object.keys(result)).toEqual(['A']);
    expect(result['A'].map((c: any) => c.nome)).toEqual(['a1']);
    expect(gruppi['B'].length).toBe(1);
  });

  it('should map the classe dato to its environment', () => {
    expect(ambienteClasseDato('collaudo')).toBe('collaudo');
    expect(ambienteClasseDato('collaudo_configurato')).toBe('collaudo');
    expect(ambienteClasseDato('collaudo_pdnd')).toBe('collaudo');
    expect(ambienteClasseDato('produzione')).toBe('produzione');
    expect(ambienteClasseDato('produzione_configurato')).toBe('produzione');
    expect(ambienteClasseDato('generico')).toBeNull();
    expect(ambienteClasseDato('identificativo')).toBeNull();
    expect(ambienteClasseDato(null)).toBeNull();
    expect(ambienteClasseDato(undefined)).toBeNull();
  });
});
