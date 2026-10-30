import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PdndAzioneDialogComponent } from './pdnd-azione-dialog.component';

describe('PdndAzioneDialogComponent', () => {
  let component: PdndAzioneDialogComponent;
  let bsModalRef: any;
  let esiti: any[];

  beforeEach(() => {
    bsModalRef = { hide: vi.fn() };
    component = new PdndAzioneDialogComponent(bsModalRef);
    component.ngOnInit();
    esiti = [];
    component.onClose.subscribe((e) => esiti.push(e));
  });

  it('should keep the reject button disabled until the reason is between 20 and 1000 characters', () => {
    component.azione = 'reject';
    expect(component._motivazioneMancante).toBe(true);
    component._onMotivazione('x'.repeat(19));
    expect(component._motivazioneMancante).toBe(true);
    component._onMotivazione('x'.repeat(20));
    expect(component._motivazioneMancante).toBe(false);
    component._onMotivazione('x'.repeat(1001));
    expect(component._motivazioneMancante).toBe(true);
    component.azione = 'suspend';
    expect(component._motivazioneMancante).toBe(false);
  });

  it('should require the reason to reject', () => {
    component.azione = 'reject';
    component.conferma();
    expect(esiti).toEqual([]);
    expect(bsModalRef.hide).not.toHaveBeenCalled();
    component._onMotivazione('  Dati mancanti ');
    component.conferma();
    expect(esiti).toEqual([]);
    component._onMotivazione('  Dati del fruitore mancanti ');
    component.conferma();
    expect(esiti).toEqual([{ reason: 'Dati del fruitore mancanti' }]);
    expect(bsModalRef.hide).toHaveBeenCalled();
  });

  it('should confirm the other actions without reason and emit null on cancel', () => {
    component.azione = 'suspend';
    component.conferma();
    component.annulla();
    expect(esiti).toEqual([{ reason: '' }, null]);
  });

  it('should show the load change only for increases of a purpose', () => {
    component.oggetto = 'purpose';
    component.azione = 'approve';
    component.caricoRichiesto = '20.000';
    expect(component._mostraCarico).toBe(true);
    component.azione = 'suspend';
    expect(component._mostraCarico).toBe(false);
    expect(component._statoRisultante).toBe('SUSPENDED');
    expect(component._chiave).toBe('APP.SUBSCRIBERS.DIALOG.PURPOSE.suspend');
  });

  it('should foresee the suspended state when others keep their suspension', () => {
    component.azione = 'unsuspend';
    expect(component._statoRisultante).toBe('ACTIVE');
    component.altreSospensioni = 'fruitore';
    expect(component._restaSospeso).toBe(true);
    expect(component._statoRisultante).toBe('SUSPENDED');
  });
});
