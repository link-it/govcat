import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpParams } from '@angular/common/http';
import { UtilService, Certificato, AuthConfig } from './utils.service';
import { TipoCertificatoEnum } from '@app/views/adesioni/adesione-configurazioni/certificato.model';
import { of, Subject } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';

describe('UtilService', () => {
  let service: UtilService;
  let mockApiService: any;
  let mockTranslate: any;
  let mockModalService: any;

  beforeEach(() => {
    mockApiService = {
      getList: vi.fn()
    };
    mockTranslate = {
      instant: vi.fn((key: string, params?: any) => key)
    };
    mockModalService = {
      show: vi.fn()
    };
    service = new UtilService(mockApiService, mockTranslate, mockModalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // _queryToHttpParams

  describe('_queryToHttpParams', () => {
    it('should convert simple query params', () => {
      const result = service._queryToHttpParams({ nome: 'test', stato: 'attivo' });
      expect(result.get('nome')).toBe('test');
      expect(result.get('stato')).toBe('attivo');
    });

    it('should skip null/undefined/empty values', () => {
      const result = service._queryToHttpParams({ nome: 'test', vuoto: null, undef: undefined, zero: '' });
      expect(result.get('nome')).toBe('test');
      expect(result.has('vuoto')).toBe(false);
      expect(result.has('undef')).toBe(false);
      expect(result.has('zero')).toBe(false);
    });

    it('should format date fields with moment when formatDate=true', () => {
      const result = service._queryToHttpParams({ data_da: new Date(2025, 0, 15) });
      expect(result.get('data_da')).toBe('2025-01-15');
    });

    it('should not format date fields when formatDate=false', () => {
      const rawDate = '2025-01-15T12:00:00';
      const result = service._queryToHttpParams({ data_da: rawDate }, false);
      expect(result.get('data_da')).toBe(rawDate);
    });

    it('should handle all date key variants', () => {
      const date = new Date(2025, 5, 20);
      const result = service._queryToHttpParams({
        data_da: date,
        data_a: date,
        data_inizio: date,
        data_fine: date
      });
      expect(result.get('data_da')).toBe('2025-06-20');
      expect(result.get('data_a')).toBe('2025-06-20');
      expect(result.get('data_inizio')).toBe('2025-06-20');
      expect(result.get('data_fine')).toBe('2025-06-20');
    });

    it('should return HttpParams instance', () => {
      const result = service._queryToHttpParams({});
      expect(result).toBeInstanceOf(HttpParams);
    });
  });

  // _order

  describe('_order', () => {
    it('should sort strings alphabetically by nome', () => {
      const items = [{ nome: 'Beta' }, { nome: 'Alpha' }, { nome: 'Gamma' }];
      items.sort(service._order);
      expect(items[0].nome).toBe('Alpha');
      expect(items[1].nome).toBe('Beta');
      expect(items[2].nome).toBe('Gamma');
    });

    it('should sort numeric strings as numbers', () => {
      const items = [{ nome: '10' }, { nome: '2' }, { nome: '1' }];
      items.sort(service._order);
      expect(items[0].nome).toBe('1');
      expect(items[1].nome).toBe('2');
      expect(items[2].nome).toBe('10');
    });

    it('should be case insensitive for strings', () => {
      const items = [{ nome: 'beta' }, { nome: 'Alpha' }];
      items.sort(service._order);
      expect(items[0].nome).toBe('Alpha');
      expect(items[1].nome).toBe('beta');
    });
  });

  // _removeEmpty

  describe('_removeEmpty', () => {
    it('should remove null values', () => {
      expect(service._removeEmpty({ a: 'ok', b: null })).toEqual({ a: 'ok' });
    });

    it('should remove undefined values', () => {
      expect(service._removeEmpty({ a: 'ok', b: undefined })).toEqual({ a: 'ok' });
    });

    it('should remove empty strings', () => {
      expect(service._removeEmpty({ a: 'ok', b: '' })).toEqual({ a: 'ok' });
    });

    it('should remove object values', () => {
      expect(service._removeEmpty({ a: 'ok', b: { nested: true } })).toEqual({ a: 'ok' });
    });

    it('should keep numbers including zero', () => {
      expect(service._removeEmpty({ a: 0, b: 42 })).toEqual({ a: 0, b: 42 });
    });

    it('should keep boolean values', () => {
      expect(service._removeEmpty({ a: true, b: false })).toEqual({ a: true, b: false });
    });
  });

  // Certificate utilities

  describe('filtraCertificatiAttivi', () => {
    it('should detect fornito when file is true', () => {
      const cert: Certificato = { file: true, cn: false, csr: false };
      const result = service.filtraCertificatiAttivi(cert);
      expect(result[TipoCertificatoEnum.FORNITO]).toBe(true);
      expect(result[TipoCertificatoEnum.RICHIESTO_CN]).toBeUndefined();
    });

    it('should detect richiesto_cn when cn is true', () => {
      const cert: Certificato = { file: false, cn: true, csr: false };
      const result = service.filtraCertificatiAttivi(cert);
      expect(result[TipoCertificatoEnum.RICHIESTO_CN]).toBe(true);
    });

    it('should detect richiesto_csr when csr is true', () => {
      const cert: Certificato = { file: false, cn: false, csr: true };
      const result = service.filtraCertificatiAttivi(cert);
      expect(result[TipoCertificatoEnum.RICHIESTO_CSR]).toBe(true);
    });

    it('should detect multiple active types', () => {
      const cert: Certificato = { file: true, cn: true, csr: false };
      const result = service.filtraCertificatiAttivi(cert);
      expect(result[TipoCertificatoEnum.FORNITO]).toBe(true);
      expect(result[TipoCertificatoEnum.RICHIESTO_CN]).toBe(true);
    });

    it('should return empty when none active', () => {
      const cert: Certificato = { file: false, cn: false, csr: false };
      const result = service.filtraCertificatiAttivi(cert);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('getTipiCertificatoAttivi', () => {
    it('should return active enum values', () => {
      const cert: Certificato = { file: true, cn: false, csr: true };
      const result = service.getTipiCertificatoAttivi(cert);
      expect(result).toContain(TipoCertificatoEnum.FORNITO);
      expect(result).toContain(TipoCertificatoEnum.RICHIESTO_CSR);
      expect(result).not.toContain(TipoCertificatoEnum.RICHIESTO_CN);
    });

    it('should return empty array when none active', () => {
      const cert: Certificato = {};
      const result = service.getTipiCertificatoAttivi(cert);
      expect(result).toHaveLength(0);
    });
  });

  describe('getTipiCertificatoDettagliati', () => {
    it('should return detailed info for active certificates', () => {
      const cert: Certificato = { file: true };
      const result = service.getTipiCertificatoDettagliati(cert);
      expect(result.length).toBe(1);
      expect(result[0].value).toBe(TipoCertificatoEnum.FORNITO);
    });
  });

  describe('getCertificatoByAuthType', () => {
    it('should find certificato by auth type', () => {
      const configs: AuthConfig[] = [
        { type: 'mtls', certificato: { file: true } },
        { type: 'pdnd', certificato: { cn: true } }
      ];
      const result = service.getCertificatoByAuthType(configs, 'mtls');
      expect(result).toEqual({ file: true });
    });

    it('should fallback to certificato_autenticazione', () => {
      const configs: AuthConfig[] = [
        { type: 'mtls', certificato_autenticazione: { cn: true } }
      ];
      const result = service.getCertificatoByAuthType(configs, 'mtls');
      expect(result).toEqual({ cn: true });
    });

    it('should fallback to certificato_firma', () => {
      const configs: AuthConfig[] = [
        { type: 'firma', certificato_firma: { csr: true } }
      ];
      const result = service.getCertificatoByAuthType(configs, 'firma');
      expect(result).toEqual({ csr: true });
    });

    it('should return null for unknown type', () => {
      const configs: AuthConfig[] = [{ type: 'mtls' }];
      const result = service.getCertificatoByAuthType(configs, 'unknown');
      expect(result).toBeNull();
    });

    it('should return null when no certificate fields', () => {
      const configs: AuthConfig[] = [{ type: 'empty' }];
      const result = service.getCertificatoByAuthType(configs, 'empty');
      expect(result).toBeNull();
    });
  });

  // Sort functions

  describe('sortByIndexPreservingOrder', () => {
    it('should sort elements with index property', () => {
      const arr = [
        { index: 3, name: 'C' },
        { name: 'NoIndex' },
        { index: 1, name: 'A' },
        { index: 2, name: 'B' }
      ];
      const result = service.sortByIndexPreservingOrder(arr);
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe('NoIndex');
      expect(result[2].name).toBe('B');
      expect(result[3].name).toBe('C');
    });

    it('should preserve position of elements without index', () => {
      const arr = [
        { name: 'NoIndex1' },
        { index: 2, name: 'B' },
        { name: 'NoIndex2' },
        { index: 1, name: 'A' }
      ];
      const result = service.sortByIndexPreservingOrder(arr);
      expect(result[0].name).toBe('NoIndex1');
      expect(result[1].name).toBe('A');
      expect(result[2].name).toBe('NoIndex2');
      expect(result[3].name).toBe('B');
    });

    it('should not modify original array', () => {
      const arr = [{ index: 2, name: 'B' }, { index: 1, name: 'A' }];
      const original = [...arr];
      service.sortByIndexPreservingOrder(arr);
      expect(arr[0].name).toBe(original[0].name);
    });
  });

  describe('sortByFieldPreservingOthers', () => {
    it('should sort by numeric field preserving non-numeric items', () => {
      const arr = [
        { priority: 3, name: 'C' },
        { name: 'NoField' },
        { priority: 1, name: 'A' },
        { priority: 2, name: 'B' }
      ];
      const result = service.sortByFieldPreservingOthers(arr, 'priority');
      expect(result[0].name).toBe('A');
      expect(result[1].name).toBe('NoField');
      expect(result[2].name).toBe('B');
      expect(result[3].name).toBe('C');
    });

    it('should handle empty array', () => {
      const result = service.sortByFieldPreservingOthers([], 'field');
      expect(result).toEqual([]);
    });

    it('should handle array with no numeric fields', () => {
      const arr = [{ name: 'A' }, { name: 'B' }];
      const result = service.sortByFieldPreservingOthers(arr, 'priority');
      expect(result).toEqual(arr);
    });

    it('should work via mapper function', () => {
      const arr = [{ order: 2, n: 'B' }, { order: 1, n: 'A' }];
      const result = service.sortByFieldPreservingOthersMapper(arr, 'order');
      expect(result[0].n).toBe('A');
      expect(result[1].n).toBe('B');
    });
  });

  // GetErrorMsg

  describe('GetErrorMsg', () => {
    it('should extract detail error code and translate', () => {
      const error = {
        status: 400,
        error: { detail: 'FIELD_REQUIRED', errori: [{ params: { field: 'nome' } }] }
      };
      service.GetErrorMsg(error);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.ERROR.FIELD_REQUIRED', { field: 'nome' });
    });

    it('should join title and detail when no error code', () => {
      const error = {
        status: 500,
        error: { title: 'Errore', detail: null }
      };
      // detail is falsy so won't enter first branch
      // title is truthy but detail is null - goes to third branch
      const msg = service.GetErrorMsg(error);
      expect(msg).toContain('Errore');
    });

    it('should handle status + statusText', () => {
      const error = { status: 403, statusText: 'Forbidden', error: null };
      const msg = service.GetErrorMsg(error);
      expect(msg).toBe('403: Forbidden');
    });

    it('should append URL for 404', () => {
      const error = { status: 404, statusText: 'Not Found', error: null, url: '/api/servizi?q=test' };
      const msg = service.GetErrorMsg(error);
      expect(msg).toContain('/api/servizi');
      expect(msg).not.toContain('?q=test');
    });

    it('should use error.message as fallback', () => {
      const error = { status: 0, message: 'Network error' };
      const msg = service.GetErrorMsg(error);
      expect(msg).toBe('Network error');
    });

    it('should translate error.name when no error body', () => {
      const error = { status: 0, name: 'TimeoutError', message: 'timeout' };
      service.GetErrorMsg(error);
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.MESSAGE.ERROR.TimeoutError');
    });

    it('should return generic message on exception', () => {
      const error = { status: 500, error: { get detail() { throw new Error('boom'); } } };
      const msg = service.GetErrorMsg(error);
      expect(msg).toContain('problema non previsto');
    });
  });

  // getUtenti

  describe('getUtenti', () => {
    it('should call getList with default params', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ nome: 'Mario', cognome: 'Rossi' }] }));
      service.getUtenti().subscribe(result => {
        expect(result[0].nome_completo).toBe('Mario Rossi');
      });
      expect(mockApiService.getList).toHaveBeenCalledWith('utenti', expect.objectContaining({
        params: expect.objectContaining({ q: null, stato: 'abilitato' })
      }));
    });

    it('should add role param when provided', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      service.getUtenti('test', 'gestore').subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('utenti', expect.objectContaining({
        params: expect.objectContaining({ ruolo: 'gestore' })
      }));
    });

    it('should add organizzazione when not referenteTecnico', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      service.getUtenti(null, null, 'abilitato', 'org1', false).subscribe();
      expect(mockApiService.getList).toHaveBeenCalledWith('utenti', expect.objectContaining({
        params: expect.objectContaining({ id_organizzazione: 'org1' })
      }));
    });

    it('should add referente_tecnico flag', () => {
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      service.getUtenti(null, null, 'abilitato', 'org1', true).subscribe();
      const callParams = mockApiService.getList.mock.calls[0][1].params;
      expect(callParams.referente_tecnico).toBe(true);
      expect(callParams.id_organizzazione).toBeUndefined();
    });
  });

  // Dialogs

  describe('_confirmDialog', () => {
    it('should show modal and call callback on confirm', () => {
      const onClose = new Subject();
      mockModalService.show.mockReturnValue({ content: { onClose } });

      const callback = vi.fn();
      service._confirmDialog('Custom message', { id: 1 }, callback);

      expect(mockModalService.show).toHaveBeenCalled();
      onClose.next(true);
      expect(callback).toHaveBeenCalledWith({ id: 1 });
    });

    it('should not call callback on cancel', () => {
      const onClose = new Subject();
      mockModalService.show.mockReturnValue({ content: { onClose } });

      const callback = vi.fn();
      service._confirmDialog(null, { id: 1 }, callback);

      onClose.next(false);
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('_confirmDelection', () => {
    it('should show modal and invoke callback on confirm', () => {
      const onClose = new Subject();
      mockModalService.show.mockReturnValue({ content: { onClose } });

      const callback = vi.fn();
      service._confirmDelection({ id: 42 }, callback);

      onClose.next(true);
      expect(callback).toHaveBeenCalledWith({ id: 42 });
    });
  });

  describe('__confirmCambioStatoServizio', () => {
    it('should translate status and show modal', () => {
      const onClose = new Subject();
      mockModalService.show.mockReturnValue({ content: { onClose } });

      const status = { status: { stato_successivo: { nome: 'pubblicato' } } };
      const callback = vi.fn();
      service.__confirmCambioStatoServizio(status, { id: 1 }, callback);

      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.pubblicato');
      onClose.next(true);
      expect(callback).toHaveBeenCalledWith(status, { id: 1 });
    });

    it('should fallback to status.nome when no stato_successivo', () => {
      const onClose = new Subject();
      mockModalService.show.mockReturnValue({ content: { onClose } });

      const status = { status: { nome: 'bozza' } };
      service.__confirmCambioStatoServizio(status, {}, vi.fn());
      expect(mockTranslate.instant).toHaveBeenCalledWith('APP.WORKFLOW.STATUS.bozza');
    });
  });

  // scrollTo

  describe('scrollTo', () => {
    it('should call scrollIntoView on the element', () => {
      const mockEl = { scrollIntoView: vi.fn() };
      vi.spyOn(document, 'getElementById').mockReturnValue(mockEl as any);

      service.scrollTo('myId');
      expect(mockEl.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'end',
        inline: 'end'
      });
    });

    it('should handle missing element', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      expect(() => service.scrollTo('missing')).not.toThrow();
    });
  });

  // _scrollTo

  describe('_scrollTo', () => {
    it('should set scrollTop to target position', () => {
      const element = { scrollTop: 0 };
      service._scrollTo(element, 100, 300);
      expect(element.scrollTop).toBe(100);
    });
  });

  // getRelativePos

  describe('getRelativePos', () => {
    it('should calculate relative position', () => {
      const parent = {
        getBoundingClientRect: () => ({ top: 10, right: 200, bottom: 100, left: 10 }),
        scrollTop: 50
      };
      const elm = {
        parentNode: parent,
        getBoundingClientRect: () => ({ top: 30, right: 150, bottom: 80, left: 20 })
      };

      const pos = service.getRelativePos(elm);
      expect(pos.top).toBe(30 - 10 + 50 + (100 - 10));
      expect(pos.left).toBe(20 - 10);
    });
  });

  // _showMandatoryFields

  describe('_showMandatoryFields', () => {
    it('should not throw', () => {
      const fg = new FormGroup({
        nome: new FormControl('', Validators.required),
        desc: new FormControl('')
      });
      expect(() => service._showMandatoryFields(fg)).not.toThrow();
    });
  });

  // refreshAnagrafiche

  describe('refreshAnagrafiche', () => {
    it('should clear cache and re-fetch', () => {
      (service as any).cacheAnagrafiche = { utenti: [1, 2] };
      mockApiService.getList.mockReturnValue(of({ content: [] }));
      const result = service.refreshAnagrafiche(['utenti']);
      expect((service as any).cacheAnagrafiche['utenti']).toBeDefined();
    });
  });
});
