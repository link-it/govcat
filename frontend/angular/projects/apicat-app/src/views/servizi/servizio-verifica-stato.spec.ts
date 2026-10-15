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
import { apiDaCompletare, apiSezioneDaCompletare, esitoDellAmbiente, sezioneDaCompletare, transizioneDaVerificare } from './servizio-verifica-stato';

describe('servizio-verifica-stato', () => {
  const _cambio = {
    stato_successivo: { nome: 'richiesto_collaudo', ruoli_abilitati: ['referente', 'gestore'] },
    stati_ulteriori: [{ nome: 'richiesto_produzione_senza_collaudo', ruoli_abilitati: ['gestore'] }]
  };

  it('should pick the main transition, or the one without testing for skip_collaudo', () => {
    expect(transizioneDaVerificare(_cambio, false)).toEqual({ nome: 'richiesto_collaudo', tipo: 'stato_successivo', ruoli: ['referente', 'gestore'] });
    expect(transizioneDaVerificare(_cambio, true)).toEqual({ nome: 'richiesto_produzione_senza_collaudo', tipo: 'stati_ulteriori', ruoli: ['gestore'] });
    expect(transizioneDaVerificare(null, false)).toBeNull();
  });

  const _esito: any = {
    esito: 'ko',
    errori: [
      { dato: 'referenti', campi: [] },
      { dato: 'collaudo', sottotipo: [{ tipo: 'api', identificativo: 'a1' }], campi: [{ nome_campo: 'url' }] }
    ]
  };

  it('should map the errors to the wizard sections', () => {
    expect(sezioneDaCompletare(_esito, 'referenti')).toBe(true);
    expect(sezioneDaCompletare(_esito, 'info_generali')).toBe(false);
    expect(apiSezioneDaCompletare(_esito)).toBe(true);
    expect(apiDaCompletare(_esito, 'a1')).toBe(true);
    expect(apiDaCompletare(_esito, 'a2')).toBe(false);
  });

  it('should map an API class error without subtype to the API section', () => {
    const _nessunaApi: any = { esito: 'ko', errori: [{ dato: 'specifica', campi: [{ nome_campo: 'api' }] }] };
    expect(apiSezioneDaCompletare(_nessunaApi)).toBe(true);
    expect(sezioneDaCompletare(_nessunaApi, 'info_generali')).toBe(false);
  });

  it('should keep only the errors of the given environment', () => {
    const _misto: any = { esito: 'ko', errori: [
      { dato: 'produzione', sottotipo: [{ tipo: 'api', identificativo: 'a1' }] },
      { dato: 'collaudo_pdnd', sottotipo: [{ tipo: 'api', identificativo: 'a2' }] },
      { dato: 'specifica', campi: [{ nome_campo: 'api' }] }
    ] };
    const _collaudo = esitoDellAmbiente(_misto, 'collaudo');
    expect(_collaudo?.errori.map((e: any) => e.dato)).toEqual(['collaudo_pdnd', 'specifica']);
    expect(apiDaCompletare(_collaudo, 'a1')).toBe(false);
    expect(esitoDellAmbiente({ esito: 'ko', errori: [{ dato: 'produzione' }] } as any, 'collaudo')).toEqual({ esito: 'ok', errori: [] });
    expect(esitoDellAmbiente(null, 'collaudo')).toBeNull();
    expect(esitoDellAmbiente(_misto, 'collaudo', false)?.errori.map((e: any) => e.dato)).toEqual(['collaudo_pdnd']);
  });

  it('should report nothing when the check is ok or missing', () => {
    expect(sezioneDaCompletare({ esito: 'ok', errori: [] }, 'referenti')).toBe(false);
    expect(apiSezioneDaCompletare(null)).toBe(false);
  });
});
