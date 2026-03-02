import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from '@linkit/components';
import { ApiClient } from './api.client';

describe('ApiClient', () => {
  let client: ApiClient;
  let httpMock: HttpTestingController;

  const mockConfig = {
    AppConfig: {
      GOVAPI: { HOST: '/api/v1', HOST_PDND: '/pdnd/v1', HOST_MONITOR: '/monitor/v1' }
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiClient,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConfigService, useValue: { getConfiguration: () => mockConfig } }
      ]
    });
    client = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(client).toBeTruthy();
  });

  describe('standard API', () => {
    it('should GET with correct base URL', () => {
      client.get('/servizi').subscribe(data => {
        expect(data).toEqual([{ id: 1 }]);
      });
      const req = httpMock.expectOne('/api/v1/servizi');
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 1 }]);
    });

    it('should POST with body', () => {
      client.post('/servizi', { nome: 'test' }).subscribe();
      const req = httpMock.expectOne('/api/v1/servizi');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ nome: 'test' });
      req.flush({});
    });

    it('should PATCH with body', () => {
      client.patch('/servizi/1', { nome: 'updated' }).subscribe();
      const req = httpMock.expectOne('/api/v1/servizi/1');
      expect(req.request.method).toBe('PATCH');
      req.flush({});
    });

    it('should PUT with body', () => {
      client.put('/servizi/1', { nome: 'replaced' }).subscribe();
      const req = httpMock.expectOne('/api/v1/servizi/1');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('should DELETE', () => {
      client.delete('/servizi/1').subscribe();
      const req = httpMock.expectOne('/api/v1/servizi/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('should getRaw with observe response', () => {
      client.getRaw('/servizi/1').subscribe(res => {
        expect(res.body).toEqual({ id: 1 });
      });
      const req = httpMock.expectOne('/api/v1/servizi/1');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 1 });
    });

    it('should getContentRaw as blob', () => {
      client.getContentRaw('/servizi/export').subscribe(res => {
        expect(res.body).toBeTruthy();
      });
      const req = httpMock.expectOne('/api/v1/servizi/export');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['test']));
    });

    it('should postRaw with observe response', () => {
      client.postRaw('/servizi', { nome: 'test' }).subscribe();
      const req = httpMock.expectOne('/api/v1/servizi');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should postUpload with observe events', () => {
      const formData = new FormData();
      client.postUpload('/upload', formData).subscribe();
      const req = httpMock.expectOne('/api/v1/upload');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('PDND API', () => {
    it('should GET from PDND endpoint', () => {
      client.getPDND('/eservices').subscribe();
      const req = httpMock.expectOne('/pdnd/v1/eservices');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should POST to PDND endpoint', () => {
      client.postPDND('/eservices', { query: 'test' }).subscribe();
      const req = httpMock.expectOne('/pdnd/v1/eservices');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });
  });

  describe('Monitor API', () => {
    it('should GET from Monitor endpoint', () => {
      client.getMonitor('/transazioni').subscribe();
      const req = httpMock.expectOne('/monitor/v1/transazioni');
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('should POST to Monitor endpoint', () => {
      client.postMonitor('/report', { filtro: {} }).subscribe();
      const req = httpMock.expectOne('/monitor/v1/report');
      expect(req.request.method).toBe('POST');
      req.flush({});
    });

    it('should getMonitorContentRaw as blob', () => {
      client.getMonitorContentRaw('/export').subscribe();
      const req = httpMock.expectOne('/monitor/v1/export');
      expect(req.request.method).toBe('GET');
      expect(req.request.responseType).toBe('blob');
      req.flush(new Blob(['data']));
    });
  });
});
