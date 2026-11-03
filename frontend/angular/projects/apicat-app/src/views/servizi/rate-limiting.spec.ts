import { describe, it, expect } from 'vitest';
import { periodiDisponibili, puoGestireRateLimiting, quoteDaRighe, rateLimitingApplicabile, rateLimitingSoloGiornaliero } from './rate-limiting';

describe('rate-limiting', () => {
  const profili = [
    { codice_interno: 'PDND', auth_type: 'pdnd', pdnd_type: 'erogazione_pdnd' },
    { codice_interno: 'PDND-AUDIT', auth_type: 'pdnd' },
    { codice_interno: 'MODI_P1', auth_type: 'https' }
  ];

  it('should apply only to the APIs provided by the domain subject', () => {
    expect(rateLimitingApplicabile({ ruolo: 'erogato_soggetto_dominio' })).toBe(true);
    expect(rateLimitingApplicabile({ ruolo: 'erogato_soggetto_aderente' })).toBe(false);
    expect(rateLimitingApplicabile(null)).toBe(false);
  });

  it('should be daily only for the APIs with a profile having a pdnd_type', () => {
    expect(rateLimitingSoloGiornaliero({ gruppi_auth_type: [{ profilo: 'PDND' }] }, profili)).toBe(true);
    expect(rateLimitingSoloGiornaliero({ gruppi_auth_type: [{ profilo: 'PDND-AUDIT' }] }, profili)).toBe(false);
    expect(rateLimitingSoloGiornaliero({ gruppi_auth_type: [{ profilo: 'MODI_P1' }] }, profili)).toBe(false);
  });

  it('should let the service managers see the summary', () => {
    expect(puoGestireRateLimiting(['referente_tecnico'])).toBe(true);
    expect(puoGestireRateLimiting(['richiedente'])).toBe(false);
    expect(puoGestireRateLimiting(undefined)).toBe(false);
  });

  it('should not propose the periods already used by the other rows', () => {
    const righe = [{ periodo: 'giorno' }, { periodo: 'ora' }, { periodo: null }];
    expect(periodiDisponibili(righe, 2)).toEqual(['minuto']);
    expect(periodiDisponibili(righe, 0)).toEqual(['giorno', 'minuto']);
  });

  it('should keep only valid quotas, sorted by period, daily for PDND', () => {
    const righe = [{ quota: '20', periodo: 'ora' }, { quota: 300, periodo: 'giorno' }, { quota: 0, periodo: 'minuto' }, { quota: 1.5, periodo: 'minuto' }, { quota: null, periodo: 'minuto' }];
    expect(quoteDaRighe(righe, false)).toEqual([{ quota: 300, periodo: 'giorno' }, { quota: 20, periodo: 'ora' }]);
    expect(quoteDaRighe([{ quota: 100, periodo: null }], true)).toEqual([{ quota: 100, periodo: 'giorno' }]);
    expect(quoteDaRighe([{ quota: 300, periodo: 'giorno' }, { quota: 20, periodo: 'ora' }], true)).toEqual([{ quota: 300, periodo: 'giorno' }]);
    expect(quoteDaRighe([], false)).toEqual([]);
  });
});
