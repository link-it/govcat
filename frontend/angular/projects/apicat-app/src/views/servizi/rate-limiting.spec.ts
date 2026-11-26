import { describe, it, expect } from 'vitest';
import {
  adeguaQuote, finalitaInErrore, finalitaLetta, finalitaNonAttiva, periodiDisponibili, puoGestireRateLimiting, quotaModificabile, quoteDaRighe,
  rateLimitingApplicabile, regolaRateLimiting
} from './rate-limiting';

describe('rate-limiting', () => {
  const profili = [
    { codice_interno: 'PDND', rate_limiting: { periodi: ['giorno'], quota_totale: { required: false }, quota_fruitore: { required: true, ruoli_abilitati: ['gestore', 'referente'] } } },
    { codice_interno: 'MODI_P1', rate_limiting: { periodi: ['minuto', 'ora', 'giorno'], quota_totale: { required: false } } },
    { codice_interno: 'MODI_P2', rate_limiting: { periodi: ['ora', 'giorno'], quota_fruitore: { ruoli_abilitati: ['gestore'] } } },
    { codice_interno: 'SENZA_REGOLA' }
  ];

  it('should apply only to the APIs provided by the domain subject', () => {
    expect(rateLimitingApplicabile({ ruolo: 'erogato_soggetto_dominio' })).toBe(true);
    expect(rateLimitingApplicabile({ ruolo: 'erogato_soggetto_aderente' })).toBe(false);
    expect(rateLimitingApplicabile(null)).toBe(false);
  });

  it('should read the rule of a single profile', () => {
    const regola = regolaRateLimiting([{ profilo: 'PDND' }], profili);
    expect(regola.periodi).toEqual(['giorno']);
    expect(regola.quotaTotale).toEqual({ required: false, ruoliAbilitati: null });
    expect(regola.quotaFruitore).toEqual({ required: true, ruoliAbilitati: ['gestore', 'referente'] });
  });

  it('should combine the rules of more profiles as the backend', () => {
    const regola = regolaRateLimiting([{ profilo: 'PDND' }, { profilo: 'MODI_P2' }], profili);
    expect(regola.periodi).toEqual(['giorno']);
    expect(regola.quotaTotale).toEqual({ required: false, ruoliAbilitati: null });
    expect(regola.quotaFruitore).toEqual({ required: true, ruoliAbilitati: ['gestore'] });
    expect(regolaRateLimiting([{ profilo: 'MODI_P1' }, { profilo: 'MODI_P2' }], profili).periodi).toEqual(['giorno', 'ora']);
  });

  it('should use the default rule without known profiles', () => {
    const regola = regolaRateLimiting([], profili);
    expect(regola.periodi).toEqual(['giorno', 'ora', 'minuto']);
    expect(regola.quotaTotale).toEqual({ required: false, ruoliAbilitati: null });
    expect(regola.quotaFruitore).toBeNull();
    expect(regolaRateLimiting([{ profilo: 'SENZA_REGOLA' }], profili).quotaFruitore).toBeNull();
  });

  it('should let edit a quota only to the enabled roles', () => {
    expect(quotaModificabile({ required: false, ruoliAbilitati: null }, [])).toBe(true);
    expect(quotaModificabile({ required: false, ruoliAbilitati: ['gestore'] }, ['referente'])).toBe(false);
    expect(quotaModificabile({ required: false, ruoliAbilitati: ['gestore'] }, ['gestore'])).toBe(true);
    expect(quotaModificabile({ required: false, ruoliAbilitati: [] }, ['gestore'])).toBe(false);
    expect(quotaModificabile(null, ['gestore'])).toBe(false);
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

  it('should send only the allowed periods and quotas, sorted by period', () => {
    const regola = regolaRateLimiting([{ profilo: 'PDND' }], profili);
    const righe = [{ periodo: 'giorno', quota: '300', quota_fruitore: 50 }, { periodo: 'ora', quota: 20, quota_fruitore: null }];
    expect(quoteDaRighe(righe, regola)).toEqual([{ periodo: 'giorno', quota: 300, quota_fruitore: 50 }]);
    const soloTotale = regolaRateLimiting([{ profilo: 'MODI_P1' }], profili);
    expect(quoteDaRighe([{ periodo: 'ora', quota: 20, quota_fruitore: 5 }, { periodo: 'giorno', quota: 300 }, { periodo: 'minuto', quota: 0 }], soloTotale))
      .toEqual([{ periodo: 'giorno', quota: 300 }, { periodo: 'ora', quota: 20 }]);
    expect(quoteDaRighe([], soloTotale)).toEqual([]);
  });

  it('should adapt the saved quotas to a new rule', () => {
    const regola = regolaRateLimiting([{ profilo: 'MODI_P2' }], profili);
    expect(adeguaQuote([{ periodo: 'ora', quota_fruitore: 10 }], regola)).toEqual({ quote: [{ periodo: 'ora', quota_fruitore: 10 }], modificate: false });
    expect(adeguaQuote([{ periodo: 'minuto', quota_fruitore: 10 }, { periodo: 'giorno', quota: 300, quota_fruitore: 30 }, { periodo: 'ora', quota: 20 }], regola))
      .toEqual({ quote: [{ periodo: 'giorno', quota_fruitore: 30 }], modificate: true });
  });

  it('should report the PDND purposes exceeded by a subscriber or by the sum of the subscribers', () => {
    const finalita = (superata: boolean) => ({ purpose_id: 'p1', quota_assegnata: 10, numero_adesioni: 1, superata });
    expect(finalitaInErrore([{ esito: 'superiore', finalita: finalita(false) }])).toBe(true);
    expect(finalitaInErrore([{ esito: 'inferiore', finalita: finalita(true) }])).toBe(true);
    expect(finalitaInErrore([{ esito: 'conforme', finalita: finalita(false) }, { esito: 'non_verificabile', finalita: finalita(false) }])).toBe(false);
    expect(finalitaInErrore(undefined)).toBe(false);
  });

  it('should consider not active a PDND purpose with a known state other than ACTIVE', () => {
    expect(finalitaNonAttiva({ purpose_id: 'p1', stato: 'SUSPENDED', quota_assegnata: 0, numero_adesioni: 1, superata: false })).toBe(true);
    expect(finalitaNonAttiva({ purpose_id: 'p1', stato: 'ACTIVE', quota_assegnata: 0, numero_adesioni: 1, superata: false })).toBe(false);
    expect(finalitaNonAttiva({ purpose_id: 'p1', errore: 'non_trovata', quota_assegnata: 0, numero_adesioni: 1, superata: false })).toBe(false);
  });

  it('should consider read a purpose without errors, not approved or rejected, not one missing on PDND', () => {
    const f = (errore?: any) => ({ purpose_id: 'p1', errore, quota_assegnata: 0, numero_adesioni: 1, superata: false });
    expect([undefined, 'non_approvata', 'rifiutata', 'non_valida', 'non_trovata', 'non_disponibile'].map((e) => finalitaLetta(f(e))))
      .toEqual([true, true, true, false, false, false]);
    expect(finalitaLetta(null)).toBe(false);
  });
});
