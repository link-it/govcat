import { describe, it, expect, vi } from 'vitest';
import { firstValueFrom, of, throwError } from 'rxjs';

import { ruoliServizio, ruoliServizio$ } from './ruoli-servizio';

describe('ruoli-servizio', () => {
  const referenti = (...ids: string[]) => ({ content: ids.map((id) => ({ tipo: 'referente', utente: { id_utente: id } })) });

  it('should keep the referente role only for the referents of the service', () => {
    expect(ruoliServizio(['referente', 'richiedente'], true)).toEqual(['referente', 'richiedente']);
    expect(ruoliServizio(['referente', 'richiedente'], false)).toEqual(['richiedente']);
    expect(ruoliServizio(null, false)).toEqual([]);
  });

  it('should not load the referents when the grant has no referente role', async () => {
    const api: any = { getDetails: vi.fn() };
    expect(await firstValueFrom(ruoliServizio$(api, 's1', ['referente_superiore'], 'u1'))).toEqual(['referente_superiore']);
    expect(await firstValueFrom(ruoliServizio$(api, 's1', undefined, 'u1'))).toEqual([]);
    expect(api.getDetails).not.toHaveBeenCalled();
  });

  it('should keep the referente role when the user is a referent of the service', async () => {
    const api: any = { getDetails: vi.fn().mockReturnValue(of(referenti('u2', 'u1'))) };
    expect(await firstValueFrom(ruoliServizio$(api, 's1', ['referente'], 'u1'))).toEqual(['referente']);
    expect(api.getDetails).toHaveBeenCalledWith('servizi', 's1', 'referenti', { params: { tipo_referente: 'referente', size: '100' } });
  });

  it('should drop the referente role of an API operator of the organization', async () => {
    const api: any = { getDetails: vi.fn().mockReturnValue(of(referenti('u2'))) };
    expect(await firstValueFrom(ruoliServizio$(api, 's1', ['referente'], 'u1'))).toEqual([]);
    expect(await firstValueFrom(ruoliServizio$(api, 's1', ['referente'], null))).toEqual([]);
  });

  it('should drop the referente role when the referents cannot be loaded', async () => {
    const api: any = { getDetails: vi.fn().mockReturnValue(throwError(() => ({ status: 403 }))) };
    expect(await firstValueFrom(ruoliServizio$(api, 's1', ['referente', 'richiedente'], 'u1'))).toEqual(['richiedente']);
  });
});
