import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse, HttpParams } from '@angular/common/http';
import { PdndService, PdndEventType } from './pdnd.service';

describe('PdndService', () => {
  let service: PdndService;
  let mockApiService: any;

  beforeEach(() => {
    mockApiService = {
      getListPDND: vi.fn().mockReturnValue(of({ id: 'test' })),
      postPDND: vi.fn().mockReturnValue(of({ eservices: [] }))
    };
    service = new PdndService(mockApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('keys', () => {
    it('should call get with correct URL', () => {
      service.keys('env1', 'kid123').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/keys/kid123', { params: undefined }
      );
    });
  });

  describe('client', () => {
    it('should call get with correct URL', () => {
      service.client('env1', 'client-abc').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/clients/client-abc', { params: undefined }
      );
    });
  });

  describe('organization', () => {
    it('should call get with correct URL', () => {
      service.organization('env1', 'org-123').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/organizations/org-123', { params: undefined }
      );
    });
  });

  describe('attribute', () => {
    it('should call get with correct URL', () => {
      service.attribute('env1', 'attr-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/attributes/attr-1', { params: undefined }
      );
    });
  });

  describe('eservice', () => {
    it('should call get with correct URL', () => {
      service.eservice('env1', 'es-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/eservices/es-1', { params: undefined }
      );
    });
  });

  describe('eserviceDescriptors', () => {
    it('should call get with correct URL', () => {
      service.eserviceDescriptors('env1', 'es-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/eservices/es-1/descriptors', { params: undefined }
      );
    });
  });

  describe('eserviceDescriptor', () => {
    it('should call get with correct URL', () => {
      service.eserviceDescriptor('env1', 'es-1', 'desc-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/eservices/es-1/descriptors/desc-1', { params: undefined }
      );
    });
  });

  describe('agreement', () => {
    it('should call get with correct URL', () => {
      service.agreement('env1', 'agr-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/agreements/agr-1', { params: undefined }
      );
    });
  });

  describe('agreementAttributes', () => {
    it('should call get with correct URL', () => {
      service.agreementAttributes('env1', 'agr-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/agreements/agr-1/attributes', { params: undefined }
      );
    });
  });

  describe('agreementPurposes', () => {
    it('should call get with correct URL', () => {
      service.agreementPurposes('env1', 'agr-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/agreements/agr-1/purposes', { params: undefined }
      );
    });
  });

  describe('purpose', () => {
    it('should call get with correct URL', () => {
      service.purpose('env1', 'purp-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/purposes/purp-1', { params: undefined }
      );
    });
  });

  describe('purposeAgreement', () => {
    it('should call get with correct URL', () => {
      service.purposeAgreement('env1', 'purp-1').subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/purposes/purp-1/agreement', { params: undefined }
      );
    });
  });

  describe('serviceList', () => {
    it('should call post with correct URL and params', () => {
      service.serviceList('env1', 'IPA', 'ext-123', 'IPA', 'attr-code').subscribe();
      expect(mockApiService.postPDND).toHaveBeenCalledWith(
        'env1/organizations/origin/IPA/externalId/ext-123/eservices',
        {},
        expect.objectContaining({ params: expect.any(HttpParams) })
      );
      const callArgs = mockApiService.postPDND.mock.calls[0];
      const params: HttpParams = callArgs[2].params;
      expect(params.get('attributeOrigin')).toBe('IPA');
      expect(params.get('attributeCode')).toBe('attr-code');
    });
  });

  describe('events', () => {
    it('should use eservices path for ESERVICES event type', () => {
      service.events(PdndEventType.ESERVICES, 'env1', 0).subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/events/eservices',
        expect.objectContaining({ params: expect.any(HttpParams) })
      );
    });

    it('should use keys path for KEYS event type', () => {
      service.events(PdndEventType.KEYS, 'env1', 0).subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/events/keys',
        expect.objectContaining({ params: expect.any(HttpParams) })
      );
    });

    it('should use default events path for ANY event type', () => {
      service.events(PdndEventType.ANY, 'env1', 0).subscribe();
      expect(mockApiService.getListPDND).toHaveBeenCalledWith(
        'env1/events',
        expect.objectContaining({ params: expect.any(HttpParams) })
      );
    });

    it('should pass lastEventId and limit as params', () => {
      service.events(PdndEventType.ANY, 'env1', 42, 50).subscribe();
      const callArgs = mockApiService.getListPDND.mock.calls[0];
      const params: HttpParams = callArgs[1].params;
      expect(params.get('lastEventId')).toBe('42');
      expect(params.get('limit')).toBe('50');
    });

    it('should use default limit of 100', () => {
      service.events(PdndEventType.ANY, 'env1', 0).subscribe();
      const callArgs = mockApiService.getListPDND.mock.calls[0];
      const params: HttpParams = callArgs[1].params;
      expect(params.get('limit')).toBe('100');
    });
  });

  describe('response mapping', () => {
    it('should wrap successful response in { data }', () => {
      const mockResponse = { id: 'org-1', name: 'Test Org' };
      mockApiService.getListPDND.mockReturnValue(of(mockResponse));
      let result: any;
      service.organization('env1', 'org-1').subscribe((r) => { result = r; });
      expect(result).toEqual({ data: mockResponse });
    });

    it('should wrap error response in { error }', () => {
      const mockError = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      mockApiService.getListPDND.mockReturnValue(throwError(() => mockError));
      let result: any;
      service.organization('env1', 'not-found').subscribe((r) => { result = r; });
      expect(result.error).toBeTruthy();
      expect(result.error.status).toBe(404);
      expect(result.data).toBeUndefined();
    });

    it('should wrap successful POST response in { data }', () => {
      const mockResponse = { eservices: [{ id: 'es-1' }] };
      mockApiService.postPDND.mockReturnValue(of(mockResponse));
      let result: any;
      service.serviceList('env1', 'IPA', 'ext-1', 'IPA', 'code').subscribe((r) => { result = r; });
      expect(result).toEqual({ data: mockResponse });
    });

    it('should wrap POST error response in { error }', () => {
      const mockError = new HttpErrorResponse({ status: 500, statusText: 'Server Error' });
      mockApiService.postPDND.mockReturnValue(throwError(() => mockError));
      let result: any;
      service.serviceList('env1', 'IPA', 'ext-1', 'IPA', 'code').subscribe((r) => { result = r; });
      expect(result.error).toBeTruthy();
      expect(result.error.status).toBe(500);
    });
  });
});
