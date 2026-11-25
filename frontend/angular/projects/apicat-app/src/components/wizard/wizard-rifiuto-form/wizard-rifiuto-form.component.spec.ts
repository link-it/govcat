import { describe, it, expect, vi, beforeEach } from 'vitest';
import { chiavePrefissoRifiuto, WizardRifiutoFormComponent } from './wizard-rifiuto-form.component';

describe('WizardRifiutoFormComponent', () => {
  let component: WizardRifiutoFormComponent;

  beforeEach(() => {
    component = new WizardRifiutoFormComponent();
    component.oggetto = 'PetStore v. 1: richiesta rifiutata';
    component.ngOnInit();
  });

  it('should propose the subject and require the reason', () => {
    const _conferma = vi.fn();
    component.conferma.subscribe(_conferma);
    expect(component._formGroup.get('oggetto')?.value).toBe('PetStore v. 1: richiesta rifiutata');
    component.onSubmit();
    expect(_conferma).not.toHaveBeenCalled();
    expect(component._hasError('testo', 'required')).toBe(true);
  });

  it('should emit the subject and the reason', () => {
    const _conferma = vi.fn();
    component.conferma.subscribe(_conferma);
    component._formGroup.get('oggetto')?.setValue('  Oggetto modificato ');
    component._formGroup.get('testo')?.setValue(' Manca la specifica ');
    component.onSubmit();
    expect(_conferma).toHaveBeenCalledWith({ oggetto: 'Oggetto modificato', testo: 'Manca la specifica' });
  });

  it('should not emit while saving', () => {
    const _conferma = vi.fn();
    component.conferma.subscribe(_conferma);
    component.saving = true;
    component._formGroup.get('testo')?.setValue('Motivo');
    component.onSubmit();
    expect(_conferma).not.toHaveBeenCalled();
  });

  describe('motivo con il prefisso dell\'ambiente', () => {
    const prefisso = 'Autorizzazione in collaudo rifiutata per il seguente motivo: ';

    beforeEach(() => {
      component = new WizardRifiutoFormComponent();
      component.oggetto = 'Oggetto';
      component.testo = prefisso;
      component.ngOnInit();
    });

    it('should prefill the reason with the prefix and require to complete it', () => {
      const _conferma = vi.fn();
      component.conferma.subscribe(_conferma);
      expect(component._formGroup.get('testo')?.value).toBe(prefisso);
      component.onSubmit();
      expect(_conferma).not.toHaveBeenCalled();
      expect(component._hasError('testo', 'required')).toBe(true);
      component._formGroup.get('testo')?.setValue(prefisso + 'manca la specifica');
      component.onSubmit();
      expect(_conferma).toHaveBeenCalledWith({ oggetto: 'Oggetto', testo: prefisso + 'manca la specifica' });
    });

    it('should choose the prefix of the environment of the requested status', () => {
      expect(chiavePrefissoRifiuto('richiesto_collaudo')).toBe('APP.WORKFLOW.RIFIUTO.PrefissoCollaudo');
      expect(chiavePrefissoRifiuto('richiesto_produzione')).toBe('APP.WORKFLOW.RIFIUTO.PrefissoProduzione');
      expect(chiavePrefissoRifiuto('richiesto_produzione_senza_collaudo')).toBe('APP.WORKFLOW.RIFIUTO.PrefissoProduzione');
    });
  });
});
