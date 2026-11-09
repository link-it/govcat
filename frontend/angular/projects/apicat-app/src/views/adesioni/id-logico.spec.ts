import { describe, it, expect } from 'vitest';
import { FormControl } from '@angular/forms';
import { ID_LOGICO_MAX, idLogicoMancante, normalizzaIdLogico, validatoriIdLogico } from './id-logico';

describe('id-logico', () => {
  it('should require a non blank value for a multi subscription service', () => {
    const ctrl = new FormControl('   ', validatoriIdLogico(true));
    expect(ctrl.hasError('required')).toBe(true);
    ctrl.setValue('ID-1');
    expect(ctrl.valid).toBe(true);
  });

  it('should not require it otherwise, limiting always the length', () => {
    const ctrl = new FormControl('', validatoriIdLogico(false));
    expect(ctrl.valid).toBe(true);
    ctrl.setValue('x'.repeat(ID_LOGICO_MAX + 1));
    expect(ctrl.hasError('maxlength')).toBe(true);
    expect(new FormControl('x'.repeat(ID_LOGICO_MAX + 1), validatoriIdLogico(true)).hasError('maxlength')).toBe(true);
  });

  it('should send the trimmed value or null', () => {
    expect(normalizzaIdLogico('  ID-1 ')).toBe('ID-1');
    expect(normalizzaIdLogico('   ')).toBeNull();
    expect(normalizzaIdLogico(null)).toBeNull();
  });

  it('should detect a subscription of a multi subscription service without logical identifier', () => {
    expect(idLogicoMancante({ servizio: { multi_adesione: true }, id_logico: null })).toBe(true);
    expect(idLogicoMancante({ servizio: { multi_adesione: true }, id_logico: ' ' })).toBe(true);
    expect(idLogicoMancante({ servizio: { multi_adesione: true }, id_logico: 'ID-1' })).toBe(false);
    expect(idLogicoMancante({ servizio: { multi_adesione: false }, id_logico: null })).toBe(false);
  });
});
