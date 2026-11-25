import { describe, it, expect } from 'vitest';

import { motivoNonEliminabile } from './servizio-non-eliminabile';

describe('motivoNonEliminabile', () => {
  it('should indicate the subscriptions when the service has neither APIs nor components', () => {
    expect(motivoNonEliminabile(false, false)).toBe('APP.MESSAGE.ERROR.SRV.400.NOT.DELETABLE.ADESIONI');
    expect(motivoNonEliminabile(true, false)).toBe('APP.MESSAGE.ERROR.SRV.400.NOT.DELETABLE.ADESIONI');
  });

  it('should use the generic text when APIs or components exist or are not loaded yet', () => {
    expect(motivoNonEliminabile(false, true)).toBe('APP.TOOLTIP.ServizioNonEliminabile');
    expect(motivoNonEliminabile(false, null)).toBe('APP.TOOLTIP.ServizioNonEliminabile');
    expect(motivoNonEliminabile(true, true)).toBe('APP.TOOLTIP.PackageNonEliminabile');
  });
});
