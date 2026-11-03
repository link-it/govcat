import { describe, it, expect, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { RateLimitingQuoteComponent } from './rate-limiting-quote.component';

describe('RateLimitingQuoteComponent', () => {
  let component: RateLimitingQuoteComponent;
  let righe: UntypedFormArray;

  const init = (soloGiornaliero = false) => {
    righe = new UntypedFormArray([]);
    component = new RateLimitingQuoteComponent();
    component.righe = righe;
    component.soloGiornaliero = soloGiornaliero;
    component.isEdit = true;
    component.ngOnChanges({ righe: new SimpleChange(null, righe, true) });
  };

  beforeEach(() => init());

  it('should load the saved quotas', () => {
    RateLimitingQuoteComponent.carica(righe, [{ quota: 20, periodo: 'ora' }, { quota: 300, periodo: 'giorno' }]);
    expect(righe.getRawValue()).toEqual([{ quota: 300, periodo: 'giorno' }, { quota: 20, periodo: 'ora' }]);
  });

  it('should add rows with a free period, up to one per period', () => {
    component.aggiungi();
    component.aggiungi();
    component.aggiungi();
    component.aggiungi();
    expect(righe.length).toBe(3);
    expect(righe.getRawValue().map((r: any) => r.periodo)).toEqual(['giorno', 'ora', 'minuto']);
    expect(component._puoAggiungere).toBe(false);
  });

  it('should offer each row only the periods not used by the others, with stable lists', () => {
    RateLimitingQuoteComponent.carica(righe, [{ quota: 300, periodo: 'giorno' }, { quota: 20, periodo: 'ora' }]);
    component.ngOnChanges({ righe: new SimpleChange(null, righe, false) });
    const prima = component._periodiRighe[0];
    expect(prima).toEqual(['giorno', 'minuto']);
    righe.at(0).get('quota')?.setValue(400);
    expect(component._periodiRighe[0]).toBe(prima);
  });

  it('should allow a single daily quota for a PDND API', () => {
    init(true);
    component.aggiungi();
    component.aggiungi();
    expect(righe.length).toBe(1);
    expect(righe.at(0).get('periodo')?.value).toBe('giorno');
  });

  it('should validate the quota as a whole number greater than zero', () => {
    component.aggiungi();
    const quota = righe.at(0).get('quota')!;
    quota.setValue(0);
    expect(quota.valid).toBe(false);
    quota.setValue(1.5);
    expect(quota.valid).toBe(false);
    quota.setValue(10);
    expect(quota.valid).toBe(true);
    component.rimuovi(0);
    expect(righe.length).toBe(0);
  });
});
