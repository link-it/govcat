import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { OpenAPIService } from './openAPI.service';

describe('OpenAPIService', () => {
  let service: OpenAPIService;
  let mockApiClient: any;

  beforeEach(() => {
    mockApiClient = {
      get: vi.fn().mockReturnValue(of([])),
      getPDND: vi.fn().mockReturnValue(of([])),
      postPDND: vi.fn().mockReturnValue(of({})),
      post: vi.fn().mockReturnValue(of({})),
      patch: vi.fn().mockReturnValue(of({})),
      put: vi.fn().mockReturnValue(of({})),
      delete: vi.fn().mockReturnValue(of({})),
      getContentRaw: vi.fn().mockReturnValue(of({})),
      getMonitor: vi.fn().mockReturnValue(of([])),
      postMonitor: vi.fn().mockReturnValue(of({})),
      getMonitorContentRaw: vi.fn().mockReturnValue(of({}))
    };
    service = new OpenAPIService(mockApiClient);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getList', () => {
    it('should call http.get with correct URL', () => {
      service.getList('servizi').subscribe();
      expect(mockApiClient.get).toHaveBeenCalledWith('/servizi', undefined);
    });

    it('should pass options', () => {
      const opts = { params: { size: '10' } };
      service.getList('servizi', opts as any).subscribe();
      expect(mockApiClient.get).toHaveBeenCalledWith('/servizi', opts);
    });

    it('should handle pageUrl for pagination', () => {
      service.getList('servizi', undefined, 'http://host/api/v1/servizi?page=2&size=10').subscribe();
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('?page=2&size=10'), undefined);
    });
  });

  describe('getListPDND', () => {
    it('should call getPDND for standard names', () => {
      service.getListPDND('eservices').subscribe();
      expect(mockApiClient.getPDND).toHaveBeenCalledWith('/eservices', undefined);
    });

    it('should return null for "others"', () => {
      service.getListPDND('others').subscribe(val => {
        expect(val).toBeNull();
      });
      expect(mockApiClient.getPDND).not.toHaveBeenCalled();
    });
  });

  describe('getDetails', () => {
    it('should build URL with id', () => {
      service.getDetails('servizi', 42).subscribe();
      expect(mockApiClient.get).toHaveBeenCalledWith('/servizi/42', expect.any(Object));
    });

    it('should build URL with id and type', () => {
      service.getDetails('servizi', 42, 'allegati').subscribe();
      expect(mockApiClient.get).toHaveBeenCalledWith('/servizi/42/allegati', expect.any(Object));
    });
  });

  describe('saveElement', () => {
    it('should POST to correct URL', () => {
      service.saveElement('servizi', { nome: 'test' }).subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/servizi', { nome: 'test' }, expect.any(Object));
    });
  });

  describe('updateElement', () => {
    it('should PATCH to correct URL', () => {
      service.updateElement('servizi', 1, { nome: 'updated' }).subscribe();
      expect(mockApiClient.patch).toHaveBeenCalledWith('/servizi/1', { nome: 'updated' }, expect.any(Object));
    });
  });

  describe('putElement', () => {
    it('should PUT to URL with id', () => {
      service.putElement('servizi', 1, { nome: 'replaced' }).subscribe();
      expect(mockApiClient.put).toHaveBeenCalledWith('/servizi/1', { nome: 'replaced' }, expect.any(Object));
    });

    it('should PUT to URL without id when id is falsy', () => {
      service.putElement('servizi', null, { nome: 'bulk' }).subscribe();
      expect(mockApiClient.put).toHaveBeenCalledWith('/servizi', { nome: 'bulk' }, expect.any(Object));
    });
  });

  describe('deleteElement', () => {
    it('should DELETE at correct URL', () => {
      service.deleteElement('servizi', 1).subscribe();
      expect(mockApiClient.delete).toHaveBeenCalledWith('/servizi/1', expect.any(Object));
    });
  });

  describe('upload', () => {
    it('should POST upload to correct URL', () => {
      const formData = new FormData();
      service.upload('allegati', formData).subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/allegati', formData, expect.any(Object));
    });
  });

  describe('download', () => {
    it('should download with id', () => {
      service.download('servizi', 1).subscribe();
      expect(mockApiClient.getContentRaw).toHaveBeenCalledWith('/servizi/1', undefined, undefined);
    });

    it('should download with id and type', () => {
      service.download('servizi', 1, 'pdf').subscribe();
      expect(mockApiClient.getContentRaw).toHaveBeenCalledWith('/servizi/1/pdf', undefined, undefined);
    });

    it('should download without id', () => {
      service.download('export', null).subscribe();
      expect(mockApiClient.getContentRaw).toHaveBeenCalledWith('/export', undefined, undefined);
    });
  });

  describe('related element operations', () => {
    it('should PUT related element', () => {
      service.putElementRelated('servizi', 1, 'allegati', { file: 'data' }).subscribe();
      expect(mockApiClient.put).toHaveBeenCalledWith('/servizi/1/allegati', { file: 'data' }, expect.any(Object));
    });

    it('should POST related element', () => {
      service.postElementRelated('servizi', 1, 'tags', { tag: 'api' }).subscribe();
      expect(mockApiClient.post).toHaveBeenCalledWith('/servizi/1/tags', { tag: 'api' }, expect.any(Object));
    });

    it('should DELETE related element', () => {
      service.deleteElementRelated('servizi', 1, 'tags/2').subscribe();
      expect(mockApiClient.delete).toHaveBeenCalledWith('/servizi/1/tags/2', expect.any(Object));
    });
  });

  describe('Monitor API', () => {
    it('should call getMonitor', () => {
      service.getMonitor('transazioni').subscribe();
      expect(mockApiClient.getMonitor).toHaveBeenCalledWith('/transazioni', undefined);
    });

    it('should return null for getMonitor with "others"', () => {
      service.getMonitor('others').subscribe(val => {
        expect(val).toBeNull();
      });
      expect(mockApiClient.getMonitor).not.toHaveBeenCalled();
    });

    it('should call postMonitor', () => {
      service.postMonitor('report', { filtro: {} }).subscribe();
      expect(mockApiClient.postMonitor).toHaveBeenCalledWith('/report', { filtro: {} }, {});
    });

    it('should call getMonitorDetails', () => {
      service.getMonitorDetails('transazioni', 5).subscribe();
      expect(mockApiClient.getMonitor).toHaveBeenCalledWith('/transazioni/5', expect.any(Object));
    });

    it('should call downloadMonitor', () => {
      service.downloadMonitor('export').subscribe();
      expect(mockApiClient.getMonitorContentRaw).toHaveBeenCalledWith('/export', undefined, undefined);
    });
  });

  describe('queryToHttpParams', () => {
    it('should convert object to HttpParams', () => {
      const result = service.queryToHttpParams({ q: 'test', page: '1' });
      expect(result instanceof HttpParams).toBe(true);
      expect(result.get('q')).toBe('test');
      expect(result.get('page')).toBe('1');
    });

    it('should skip null values', () => {
      const result = service.queryToHttpParams({ q: 'test', empty: null });
      expect(result.get('q')).toBe('test');
      expect(result.has('empty')).toBe(false);
    });
  });

  describe('getData', () => {
    it('should call getList with pagination params', () => {
      mockApiClient.get.mockReturnValue(of({ content: [{ id: 1 }, { id: 2 }] }));
      service.getData('servizi').subscribe(items => {
        expect(items).toEqual([{ id: 1 }, { id: 2 }]);
      });
      expect(mockApiClient.get).toHaveBeenCalled();
    });

    it('should pass string term as q param', () => {
      mockApiClient.get.mockReturnValue(of({ content: [] }));
      service.getData('servizi', 'search').subscribe();
      const callArgs = mockApiClient.get.mock.calls[0];
      expect(callArgs[1].params.q).toBe('search');
    });

    it('should merge object term into params', () => {
      mockApiClient.get.mockReturnValue(of({ content: [] }));
      service.getData('servizi', { stato: 'attivo' }).subscribe();
      const callArgs = mockApiClient.get.mock.calls[0];
      expect(callArgs[1].params.stato).toBe('attivo');
    });
  });

  describe('getDataPagination', () => {
    it('should call getList with page params', () => {
      mockApiClient.get.mockReturnValue(of({ content: [{ id: 1 }] }));
      service.getDataPagination('servizi', null, 2, 20).subscribe(items => {
        expect(items).toEqual([{ id: 1 }]);
      });
      const callArgs = mockApiClient.get.mock.calls[0];
      expect(callArgs[1].params.page).toBe(2);
      expect(callArgs[1].params.size).toBe(20);
    });
  });
});
