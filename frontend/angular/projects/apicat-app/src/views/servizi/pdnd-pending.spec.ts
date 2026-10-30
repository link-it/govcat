import { describe, it, expect, vi } from 'vitest';
import { of, throwError, firstValueFrom } from 'rxjs';
import { contaAzioniPdndInAttesa } from './pdnd-pending';
import { getPdndEserviceId } from './pdnd-menu.util';

describe('contaAzioniPdndInAttesa (Issue #416)', () => {
  const api = (collaudo: string, produzione: string) => ({
    id_api: 'a1',
    proprieta_custom: [
      { gruppo: 'PDNDCollaudo_identificativo', proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: collaudo }] },
      { gruppo: 'PDNDProduzione', proprieta: [{ nome: 'identificativo_eservice_pdnd', valore: produzione }] }
    ]
  });
  const producer = { producerIdCollaudo: 'pc', producerIdProduzione: 'pp' };
  const purposes = { data: { purposes: [{ id: 'p1', waitingForApproval: { id: 'v', throughput: 10 } }, { id: 'p2' }] } };

  it('should sum pending agreements and purposes to approve, following the pages', async () => {
    const apiService = {
      getListPDND: vi.fn((nome: string, _opts: any, url?: string) => {
        if (nome.startsWith('produzione')) { return of({ subscribers: [] }); }
        return url
          ? of({ subscribers: [{ agreementId: 'ag2', state: 'ACTIVE' }] })
          : of({ subscribers: [{ agreementId: 'ag1', state: 'PENDING' }], _links: { next: { href: 'http://x/collaudo/subscribers?page=1' } } });
      })
    };
    const pdndService = { agreementPurposes: vi.fn().mockReturnValue(of(purposes)) };
    const totale = await firstValueFrom(contaAzioniPdndInAttesa(apiService, pdndService, [api('es-c', 'es-p')], producer));
    // 1 accordo PENDING + 1 finalita` da approvare per ciascuno dei 2 accordi
    expect(totale).toBe(3);
    expect(apiService.getListPDND).toHaveBeenCalledWith('collaudo/subscribers', { params: { eserviceId: 'es-c', producerId: 'pc' } });
    expect(pdndService.agreementPurposes).toHaveBeenCalledWith('collaudo', 'ag2');
  });

  it('should skip environments without e-service or producer and ignore errors', async () => {
    const apiService = { getListPDND: vi.fn().mockReturnValue(throwError(() => new Error('ko'))) };
    const pdndService = { agreementPurposes: vi.fn() };
    expect(await firstValueFrom(contaAzioniPdndInAttesa(apiService, pdndService, [api('', '')], producer))).toBe(0);
    expect(apiService.getListPDND).not.toHaveBeenCalled();
    expect(await firstValueFrom(contaAzioniPdndInAttesa(apiService, pdndService, [api('es-c', '')], producer))).toBe(0);
  });

  it('should read the e-service id from the identifier group first', () => {
    expect(getPdndEserviceId(api('es-c', 'es-p'), 'collaudo')).toBe('es-c');
    expect(getPdndEserviceId(api('es-c', 'es-p'), 'produzione')).toBe('es-p');
    expect(getPdndEserviceId(null, 'collaudo')).toBe('');
  });
});
