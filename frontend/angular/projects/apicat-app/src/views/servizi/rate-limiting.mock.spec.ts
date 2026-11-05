import { describe, it, expect } from 'vitest';
import { RATE_LIMITING_MOCK_QUOTE, apiMock, apiRiepilogoMock, fruitoriMock, quoteMock, rateLimitingMockAttivo, riepilogoMock, verificaMock } from './rate-limiting.mock';

describe('rate-limiting.mock', () => {
  it('should be enabled only by the app-config flag', () => {
    expect(rateLimitingMockAttivo({ AppConfig: { Services: { rateLimitingMock: true } } })).toBe(true);
    expect(rateLimitingMockAttivo({ AppConfig: { Services: {} } })).toBe(false);
    expect(rateLimitingMockAttivo(null)).toBe(false);
  });

  it('should keep the declared quotas and give each API different sample quotas', () => {
    expect(quoteMock([{ periodo: 'ora', quota: 5 }])).toEqual([{ periodo: 'ora', quota: 5 }]);
    expect(quoteMock([], 0)).toEqual(RATE_LIMITING_MOCK_QUOTE[0]);
    expect(quoteMock(null, 1)).toEqual(RATE_LIMITING_MOCK_QUOTE[1]);
  });

  it('should show more APIs, adding sample ones to the service APIs', () => {
    expect(apiMock([{ id_api: 'a1' }]).map((a) => a.id_api)).toEqual(['a1', 'mock-api-2', 'mock-api-3']);
    expect(apiMock([{ id_api: 'a1' }, { id_api: 'a2' }, { id_api: 'a3' }, { id_api: 'a4' }])).toHaveLength(3);
  });

  it('should add consumers without quotas, to show many consumers', () => {
    const fruitori = fruitoriMock([{ id_api: 'a1', quote: RATE_LIMITING_MOCK_QUOTE[0] }]);
    expect(fruitori).toHaveLength(45);
    expect(fruitori[44]).toMatchObject({ soggetto: { nome: 'Comune di Esempio 45' }, rate_limiting: [] });
  });

  it('should compute the summary from the consumers quotas, reporting the exceeded quota', () => {
    const base = { api: [{ id_api: 'a1', nome: 'API 1', versione: 1, collaudo: [], produzione: [] }] };
    const fruitori = fruitoriMock(apiRiepilogoMock(base, 'collaudo'));
    const riepilogo = riepilogoMock(base, fruitori, 'collaudo');
    expect(riepilogo.api.map((a) => a.id_api)).toEqual(['a1', 'mock-api-2', 'mock-api-3']);
    const [giorno, ora] = riepilogo.api[0].collaudo;
    expect(giorno).toMatchObject({ periodo: 'giorno', quota: 10000, quota_assegnata: 11700, quota_residua: -1700, numero_fruitori: 5, superata: true });
    expect(ora).toMatchObject({ periodo: 'ora', quota: 600, quota_assegnata: 585, quota_residua: 15, superata: false });
    expect(riepilogo.api[1].collaudo).toEqual([expect.objectContaining({ periodo: 'giorno', quota: 5000, quota_assegnata: 4875, superata: false })]);
    const minuto = riepilogo.api[2].collaudo.find((v) => v.periodo === 'minuto');
    expect(minuto).toMatchObject({ quota_fruitore: 20, quota_assegnata: 78, superata: false });
    expect(minuto).not.toHaveProperty('quota_residua');
    expect(riepilogo.api[0].produzione).toEqual([]);
  });

  it('should check the subscription against the quotas already authorized', () => {
    const verifica = verificaMock([{ id_api: 'a1', nome: 'API 1', versione: 1 }], [{ id_api: 'a1', periodo: 'ora', quota: 10 }]);
    expect(verifica.api.map((a) => a.id_api)).toEqual(['a1', 'mock-api-2', 'mock-api-3']);
    const [giorno, ora] = verifica.api[0].rate_limiting;
    expect(giorno).toMatchObject({
      quota_richiesta: 2700, quota_autorizzata: 8400, numero_fruitori_autorizzati: 3, quota_in_attesa: 3300, numero_fruitori_in_attesa: 2,
      quota_residua: 1600, sfora: true
    });
    expect(ora).toMatchObject({ quota_richiesta: 10, quota_autorizzata: 420, quota_residua: 180, sfora: false });
    const minuto = verifica.api[2].rate_limiting.find((v) => v.periodo === 'minuto');
    expect(minuto).toMatchObject({ quota_richiesta: 18, quota_autorizzata: 56, sfora: false });
    expect(minuto).not.toHaveProperty('quota_residua');
    expect(verifica.rientra).toBe(false);
  });

  it('should add to the summary the quotas already authorized', () => {
    const base = { api: [{ id_api: 'a1', nome: 'API 1', versione: 1, collaudo: [], produzione: [] }] };
    const riepilogo = riepilogoMock(base, fruitoriMock(apiRiepilogoMock(base, 'collaudo')), 'collaudo');
    expect(riepilogo.api[0].collaudo[0]).toMatchObject({ quota_autorizzata: 8400, numero_fruitori_autorizzati: 3, quota_residua_autorizzata: 1600 });
  });
});
