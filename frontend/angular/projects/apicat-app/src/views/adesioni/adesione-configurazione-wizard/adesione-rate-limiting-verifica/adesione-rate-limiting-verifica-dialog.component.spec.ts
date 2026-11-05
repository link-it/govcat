import { describe, it, expect, vi } from 'vitest';
import { AdesioneRateLimitingVerificaDialogComponent } from './adesione-rate-limiting-verifica-dialog.component';

describe('AdesioneRateLimitingVerificaDialogComponent (Issue #402)', () => {
  const periodo = (extra: any) => ({
    periodo: 'giorno', quota: 100, quota_fruitore: 30, quota_richiesta: 10, quota_autorizzata: 50, numero_fruitori_autorizzati: 2,
    quota_in_attesa: 20, numero_fruitori_in_attesa: 1, quota_residua: 50, sfora: false, ...extra
  });

  const crea = () => {
    const component = new AdesioneRateLimitingVerificaDialogComponent({ hide: vi.fn() } as any);
    component.verifica = {
      rientra: false,
      api: [
        { id_api: 'a1', nome: 'API 1', versione: 1, rate_limiting: [periodo({})] },
        { id_api: 'a2', nome: 'API 2', versione: 2, rate_limiting: [periodo({ quota_richiesta: 60, sfora: true }), periodo({ periodo: 'ora', quota: undefined, quota_residua: undefined })] }
      ]
    } as any;
    component.ngOnInit();
    return component;
  };

  it('should open on the first API exceeding the quota, marking it in the tabs, with its periods as consumer columns', () => {
    const component = crea();
    expect(component._apiSelezionata?.id_api).toBe('a2');
    expect(component._tabs.map((t) => [t.label, !!t.badge])).toEqual([['API 1 v1', false], ['API 2 v2', true]]);
    expect(component._colonne).toEqual([
      { chiave: 'a2|giorno', id_api: 'a2', periodo: 'giorno', quota_fruitore: 30 },
      { chiave: 'a2|ora', id_api: 'a2', periodo: 'ora', quota_fruitore: 30 }
    ]);
    component.seleziona('a1');
    expect(component._colonne.map((c) => c.chiave)).toEqual(['a1|giorno']);
    expect(component._sfora).toBe(true);
  });

  it('should compute the remaining quota after the authorization only with an overall quota and a request', () => {
    const component = crea();
    expect(component._residuaDopo(periodo({ quota_richiesta: 60 }) as any)).toBe(-10);
    expect(component._residuaDopo(periodo({ quota_richiesta: undefined }) as any)).toBeNull();
    expect(component._residuaDopo(periodo({ quota_residua: undefined }) as any)).toBeNull();
  });

  it('should build the current subscription with the requested quotas of every API', () => {
    const component = new AdesioneRateLimitingVerificaDialogComponent({ hide: vi.fn() } as any);
    component.adesione = { id_adesione: 'ad1', id_logico: 'L1', soggetto: { nome: 'Ente 1' }, stato: 'richiesto_collaudo' };
    component.verifica = {
      rientra: true,
      api: [
        { id_api: 'a1', nome: 'API 1', versione: 1, rate_limiting: [periodo({}), periodo({ periodo: 'ora', quota_richiesta: undefined })] },
        { id_api: 'a2', nome: 'API 2', versione: 2, rate_limiting: [periodo({ quota_richiesta: 60 })] }
      ]
    } as any;
    component.ngOnInit();
    expect(component._corrente).toEqual({
      id_adesione: 'ad1', id_logico: 'L1', soggetto: { nome: 'Ente 1' }, stato: 'richiesto_collaudo',
      rate_limiting: [{ id_api: 'a1', periodo: 'giorno', quota: 10 }, { id_api: 'a2', periodo: 'giorno', quota: 60 }]
    });
    expect(crea()._corrente).toBeNull();
  });
});
