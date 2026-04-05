import { describe, it, expect, beforeEach } from 'vitest';
import { Message } from './message';

describe('Message', () => {

  it('should create an instance with default values', () => {
    const model = new Message();
    expect(model).toBeTruthy();
    expect(model.id).toBeNull();
    expect(model.legal_name).toBeNull();
    expect(model.office_at).toBeNull();
    expect(model.office_address).toBeNull();
    expect(model.office_address_details).toBeNull();
    expect(model.office_zip).toBeNull();
    expect(model.office_municipality).toBeNull();
    expect(model.office_municipality_details).toBeNull();
    expect(model.office_province).toBeNull();
    expect(model.office_foreign_state).toBeNull();
    expect(model.office_phone_number).toBeNull();
    expect(model.office_email_address).toBeNull();
    expect(model.office_pec_address).toBeNull();
    expect(model.tax_code).toBeNull();
    expect(model.logo_miniature).toBeNull();
    expect(model.logo).toBeNull();
  });

  it('should assign all properties from data', () => {
    const data = {
      id: 42,
      legal_name: 'Comune di Roma',
      office_at: 'Ufficio IT',
      office_address: 'Via Roma 1',
      office_address_details: 'Interno 5',
      office_zip: '00100',
      office_municipality: 'Roma',
      office_municipality_details: 'RM',
      office_province: 'Roma',
      office_foreign_state: null,
      office_phone_number: '+39 06 1234567',
      office_email_address: 'info@comune.roma.it',
      office_pec_address: 'pec@comune.roma.it',
      tax_code: '12345678901',
      logo_miniature: 'base64mini',
      logo: 'base64full'
    };
    const model = new Message(data);
    expect(model.id).toBe(42);
    expect(model.legal_name).toBe('Comune di Roma');
    expect(model.office_at).toBe('Ufficio IT');
    expect(model.office_address).toBe('Via Roma 1');
    expect(model.office_address_details).toBe('Interno 5');
    expect(model.office_zip).toBe('00100');
    expect(model.office_municipality).toBe('Roma');
    expect(model.office_municipality_details).toBe('RM');
    expect(model.office_province).toBe('Roma');
    expect(model.office_phone_number).toBe('+39 06 1234567');
    expect(model.office_email_address).toBe('info@comune.roma.it');
    expect(model.office_pec_address).toBe('pec@comune.roma.it');
    expect(model.tax_code).toBe('12345678901');
    expect(model.logo_miniature).toBe('base64mini');
    expect(model.logo).toBe('base64full');
  });

  it('should ignore null values in data (keeps default null)', () => {
    const data = { legal_name: null, office_at: 'test' };
    const model = new Message(data);
    expect(model.legal_name).toBeNull();
    expect(model.office_at).toBe('test');
  });

  it('should ignore undefined values in data', () => {
    const data = { id: undefined, legal_name: 'Test' };
    const model = new Message(data);
    expect(model.id).toBeNull();
    expect(model.legal_name).toBe('Test');
  });

  it('should ignore extra properties not defined on the class', () => {
    const data = { legal_name: 'Test', unknownProp: 'extra' };
    const model = new Message(data);
    expect(model.legal_name).toBe('Test');
    expect((model as any).unknownProp).toBeUndefined();
  });

  it('should handle empty data object', () => {
    const model = new Message({});
    expect(model.id).toBeNull();
    expect(model.legal_name).toBeNull();
  });

  it('should handle no data argument', () => {
    const model = new Message();
    expect(model.id).toBeNull();
  });

  it('should accept partial data', () => {
    const data = { id: 1, tax_code: 'CF001' };
    const model = new Message(data);
    expect(model.id).toBe(1);
    expect(model.tax_code).toBe('CF001');
    expect(model.legal_name).toBeNull();
    expect(model.office_address).toBeNull();
  });
});
