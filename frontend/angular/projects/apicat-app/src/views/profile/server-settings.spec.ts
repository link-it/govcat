import { describe, it, expect, beforeEach } from 'vitest';
import { ServerSettings } from './server-settings';

describe('ServerSettings', () => {

  it('should create an instance with no data (all enabled)', () => {
    const model = new ServerSettings();
    expect(model).toBeTruthy();
    expect(model.emetti_per_tipi).toBeUndefined();
    expect(model.emetti_per_entita).toBeUndefined();
    expect(model.emetti_per_ruoli).toBeUndefined();
  });

  it('should assign arrays from data', () => {
    const data = {
      emetti_per_tipi: ['comunicazione', 'cambio_stato'],
      emetti_per_entita: ['servizio', 'adesione'],
      emetti_per_ruoli: ['servizio_referente_dominio']
    };
    const model = new ServerSettings(data);
    expect(model.emetti_per_tipi).toEqual(['comunicazione', 'cambio_stato']);
    expect(model.emetti_per_entita).toEqual(['servizio', 'adesione']);
    expect(model.emetti_per_ruoli).toEqual(['servizio_referente_dominio']);
  });

  it('should assign empty arrays from data (all disabled)', () => {
    const data = {
      emetti_per_tipi: [],
      emetti_per_entita: [],
      emetti_per_ruoli: []
    };
    const model = new ServerSettings(data);
    expect(model.emetti_per_tipi).toEqual([]);
    expect(model.emetti_per_entita).toEqual([]);
    expect(model.emetti_per_ruoli).toEqual([]);
  });

  it('should handle partial data (only some sections)', () => {
    const data = { emetti_per_tipi: ['comunicazione'] };
    const model = new ServerSettings(data);
    expect(model.emetti_per_tipi).toEqual(['comunicazione']);
    expect(model.emetti_per_entita).toBeUndefined();
    expect(model.emetti_per_ruoli).toBeUndefined();
  });

  it('should handle empty data object (all enabled)', () => {
    const model = new ServerSettings({});
    expect(model.emetti_per_tipi).toBeUndefined();
    expect(model.emetti_per_entita).toBeUndefined();
    expect(model.emetti_per_ruoli).toBeUndefined();
  });

  describe('isAllDisabled getter', () => {
    it('should return true when all arrays are empty', () => {
      const model = new ServerSettings({
        emetti_per_tipi: [],
        emetti_per_entita: [],
        emetti_per_ruoli: []
      });
      expect(model.isAllDisabled).toBe(true);
    });

    it('should return false when some arrays have values', () => {
      const model = new ServerSettings({
        emetti_per_tipi: ['comunicazione'],
        emetti_per_entita: [],
        emetti_per_ruoli: []
      });
      expect(model.isAllDisabled).toBe(false);
    });

    it('should return false when arrays are undefined', () => {
      const model = new ServerSettings();
      expect(model.isAllDisabled).toBe(false);
    });

    it('should return false when only some arrays are empty and others undefined', () => {
      const model = new ServerSettings({ emetti_per_tipi: [] });
      expect(model.isAllDisabled).toBe(false);
    });
  });

  describe('isAllEnabled getter', () => {
    it('should return true when no data is provided', () => {
      const model = new ServerSettings();
      expect(model.isAllEnabled).toBe(true);
    });

    it('should return true when empty data object provided', () => {
      const model = new ServerSettings({});
      expect(model.isAllEnabled).toBe(true);
    });

    it('should return false when any section is defined', () => {
      const model = new ServerSettings({ emetti_per_tipi: ['comunicazione'] });
      expect(model.isAllEnabled).toBe(false);
    });

    it('should return false when arrays are empty (disabled, not enabled)', () => {
      const model = new ServerSettings({
        emetti_per_tipi: [],
        emetti_per_entita: [],
        emetti_per_ruoli: []
      });
      expect(model.isAllEnabled).toBe(false);
    });
  });

  it('isAllDisabled and isAllEnabled should be mutually exclusive for definite states', () => {
    // All enabled
    const allEnabled = new ServerSettings();
    expect(allEnabled.isAllEnabled).toBe(true);
    expect(allEnabled.isAllDisabled).toBe(false);

    // All disabled
    const allDisabled = new ServerSettings({
      emetti_per_tipi: [],
      emetti_per_entita: [],
      emetti_per_ruoli: []
    });
    expect(allDisabled.isAllEnabled).toBe(false);
    expect(allDisabled.isAllDisabled).toBe(true);

    // Partial: neither all enabled nor all disabled
    const partial = new ServerSettings({ emetti_per_tipi: ['comunicazione'] });
    expect(partial.isAllEnabled).toBe(false);
    expect(partial.isAllDisabled).toBe(false);
  });
});
