import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from '@linkit/components';
import { RestApiService } from './rest-api.service';
import { of } from 'rxjs';

describe('RestApiService', () => {
  let service: RestApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        RestApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ConfigService,
          useValue: {
            getConfig: () => of({ AppConfig: { GOVAPI: { HOST: '/api/v1' } } })
          }
        }
      ]
    });
    service = TestBed.inject(RestApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call GET for list', () => {
    service.get('servizi').subscribe(data => {
      expect(data).toEqual([{ id: 1 }]);
    });
    const req = httpMock.expectOne(r => r.url.includes('/servizi'));
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1 }]);
  });

  it('should call GET for details with id', () => {
    service.getDetails('servizi', 42).subscribe(data => {
      expect(data).toEqual({ id: 42 });
    });
    const req = httpMock.expectOne(r => r.url.includes('/servizi/42'));
    expect(req.request.method).toBe('GET');
    req.flush({ id: 42 });
  });

  it('should call POST for create', () => {
    service.create('servizi', { nome: 'test' }).subscribe(data => {
      expect(data).toEqual({ id: 1, nome: 'test' });
    });
    const req = httpMock.expectOne(r => r.url.includes('/servizi'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toBe(JSON.stringify({ nome: 'test' }));
    req.flush({ id: 1, nome: 'test' });
  });

  it('should call PUT for updatePut', () => {
    service.updatePut('servizi', 1, { nome: 'updated' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/servizi/1'));
    expect(req.request.method).toBe('PUT');
    req.flush({});
  });

  it('should call PATCH for update', () => {
    service.update('servizi', 1, { nome: 'patched' }).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/servizi/1'));
    expect(req.request.method).toBe('PATCH');
    req.flush({});
  });

  it('should call DELETE', () => {
    service.delete('servizi', 1).subscribe();
    const req = httpMock.expectOne(r => r.url.includes('/servizi/1'));
    expect(req.request.method).toBe('DELETE');
    req.flush({});
  });
});
