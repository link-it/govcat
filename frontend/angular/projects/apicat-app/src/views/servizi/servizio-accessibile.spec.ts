import { describe, it, expect } from 'vitest';

import { servizioNonAccessibile, statoErrore } from './servizio-accessibile';

describe('servizio-accessibile', () => {
  it('should read the HTTP status also from the body rethrown by the error interceptor', () => {
    expect(statoErrore({ status: 404 })).toBe(404);
    expect(statoErrore({ message: 'Not Found', error: { status: 404, detail: 'SRV.404' } })).toBe(404);
    expect(statoErrore({ message: 'boom' })).toBeUndefined();
    expect(statoErrore(null)).toBeUndefined();
  });

  it('should consider 404 and 403 as a service not accessible', () => {
    expect(servizioNonAccessibile({ message: 'Not Found', error: { status: 404, detail: 'SRV.404' } })).toBe(true);
    expect(servizioNonAccessibile({ status: 403 })).toBe(true);
    expect(servizioNonAccessibile({ error: { status: 500 } })).toBe(false);
    expect(servizioNonAccessibile({ message: 'Network fail' })).toBe(false);
  });
});
