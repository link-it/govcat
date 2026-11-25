import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { RateLimitingQuoteComponent } from './rate-limiting-quote.component';
import { RegolaRateLimiting } from '../rate-limiting';

describe('RateLimitingQuoteComponent', () => {
  let component: RateLimitingQuoteComponent;
  let righe: UntypedFormArray;

  const TUTTI: RegolaRateLimiting = { periodi: ['giorno', 'ora', 'minuto'], quotaTotale: { required: false, ruoliAbilitati: null }, quotaFruitore: { required: false, ruoliAbilitati: null } };
  const GIORNO: RegolaRateLimiting = { periodi: ['giorno'], quotaTotale: { required: false, ruoliAbilitati: null }, quotaFruitore: null };

  const init = (regola: RegolaRateLimiting = TUTTI, ruoli: string[] | null = null) => {
    righe = new UntypedFormArray([]);
    component = new RateLimitingQuoteComponent();
    component.righe = righe;
    component.regola = regola;
    component.ruoli = ruoli;
    component.isEdit = true;
    component.ngOnChanges({ righe: new SimpleChange(null, righe, true), regola: new SimpleChange(null, regola, true) });
  };

  beforeEach(() => init());

  it('should load the saved quotas', () => {
    RateLimitingQuoteComponent.carica(righe, [{ quota: 20, periodo: 'ora' }, { quota: 300, quota_fruitore: 30, periodo: 'giorno' }]);
    expect(righe.getRawValue()).toEqual([
      { periodo: 'giorno', quota: 300, quota_fruitore: 30 },
      { periodo: 'ora', quota: 20, quota_fruitore: null }
    ]);
  });

  it('should add rows with a free period, up to one per allowed period', () => {
    component.aggiungi();
    component.aggiungi();
    component.aggiungi();
    component.aggiungi();
    expect(righe.length).toBe(3);
    expect(righe.getRawValue().map((r: any) => r.periodo)).toEqual(['giorno', 'ora', 'minuto']);
    expect(component._puoAggiungere).toBe(false);
  });

  it('should offer each row only the allowed periods not used by the others, with stable lists', () => {
    RateLimitingQuoteComponent.carica(righe, [{ quota: 300, periodo: 'giorno' }, { quota: 20, periodo: 'ora' }]);
    component.ngOnChanges({ righe: new SimpleChange(null, righe, false) });
    const prima = component._periodiRighe[0];
    expect(prima).toEqual(['giorno', 'minuto']);
    righe.at(0).get('quota')?.setValue(400);
    expect(component._periodiRighe[0]).toBe(prima);
  });

  it('should fix the period when the rule allows only one', () => {
    init(GIORNO);
    component.aggiungi();
    component.aggiungi();
    expect(righe.length).toBe(1);
    expect(righe.at(0).get('periodo')?.value).toBe('giorno');
    expect(righe.at(0).get('periodo')?.disabled).toBe(true);
  });

  it('should require at least one quota, with the consumer quota not above the overall one', () => {
    component.aggiungi();
    const riga = righe.at(0);
    expect(riga.hasError('quotaAssente')).toBe(true);
    riga.get('quota_fruitore')?.setValue(10);
    expect(riga.valid).toBe(true);
    riga.get('quota')?.setValue(5);
    expect(riga.hasError('fruitoreSuperiore')).toBe(true);
    riga.get('quota')?.setValue(1.5);
    expect(riga.get('quota')?.valid).toBe(false);
    riga.get('quota')?.setValue(10);
    expect(riga.valid).toBe(true);
    component.rimuovi(0);
    expect(righe.length).toBe(0);
  });

  it('should name in the row error only the quotas provided by the rule', () => {
    init(GIORNO);
    component.aggiungi();
    righe.at(0).markAsTouched();
    expect(component._erroreRiga(0)).toBe('APP.API.RATE_LIMITING.QuotaTotaleAssente');
    init();
    component.aggiungi();
    righe.at(0).markAsTouched();
    expect(component._erroreRiga(0)).toBe('APP.API.RATE_LIMITING.QuotaAssente');
  });

  it('should keep read-only the quotas not enabled for the user roles', () => {
    const regola: RegolaRateLimiting = { ...TUTTI, quotaTotale: { required: true, ruoliAbilitati: ['gestore'] } };
    init(regola, ['referente']);
    RateLimitingQuoteComponent.carica(righe, [{ quota: 300, quota_fruitore: 30, periodo: 'giorno' }]);
    RateLimitingQuoteComponent.applicaRegola(righe, regola, ['referente']);
    expect(righe.at(0).get('quota')?.disabled).toBe(true);
    expect(righe.at(0).get('quota_fruitore')?.disabled).toBe(false);
    expect(righe.at(0).get('periodo')?.disabled).toBe(true);
    expect(component._puoAggiungere).toBe(false);
    expect(component._puoRimuovere).toBe(false);
  });
});
