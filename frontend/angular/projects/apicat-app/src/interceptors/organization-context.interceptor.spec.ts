/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 */
import { TestBed } from '@angular/core/testing';
import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { ConfigService } from '@linkit/components';

import { OrganizationContextService } from '@services/organization-context.service';

import { ORG_CONTEXT_HEADER, OrganizationContextInterceptor } from './organization-context.interceptor';

describe('OrganizationContextInterceptor', () => {
    let interceptor: OrganizationContextInterceptor;
    let orgContext: OrganizationContextService;
    let mockHandler: HttpHandler;

    beforeEach(() => {
        localStorage.clear();
        mockHandler = {
            handle: vi.fn().mockReturnValue(of(new HttpResponse({ status: 200 })))
        };
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: ConfigService,
                    useValue: {
                        getConfiguration: () => ({
                            AppConfig: { Organization: { ContextSelector: { storageKey: 'govcat.organizationContext' } } }
                        })
                    }
                }
            ]
        });
        orgContext = TestBed.inject(OrganizationContextService);
        interceptor = TestBed.inject(OrganizationContextInterceptor);
    });

    function lastHandledReq(): HttpRequest<any> {
        return (mockHandler.handle as any).mock.calls.at(-1)[0];
    }

    it('should be created', () => {
        expect(interceptor).toBeTruthy();
    });

    it('should not add header when no current organization', () => {
        const req = new HttpRequest('GET', '/api/v1/servizi');
        interceptor.intercept(req, mockHandler);
        expect(lastHandledReq().headers.has(ORG_CONTEXT_HEADER)).toBe(false);
    });

    it('should add X-Organization-Context header when current org is set', () => {
        orgContext.setCurrent({
            organizzazione: { id_organizzazione: 'abc-123', nome: 'Org' },
            ruolo_organizzazione: null
        });
        const req = new HttpRequest('GET', '/api/v1/servizi');
        interceptor.intercept(req, mockHandler);
        expect(lastHandledReq().headers.get(ORG_CONTEXT_HEADER)).toBe('abc-123');
    });

    it('should skip URL containing `-config.json`', () => {
        orgContext.setCurrent({
            organizzazione: { id_organizzazione: 'abc', nome: 'X' },
            ruolo_organizzazione: null
        });
        const req = new HttpRequest('GET', '/assets/config/app-config.json');
        interceptor.intercept(req, mockHandler);
        expect(lastHandledReq().headers.has(ORG_CONTEXT_HEADER)).toBe(false);
    });

    it('should skip URL containing `/configurazione`', () => {
        orgContext.setCurrent({
            organizzazione: { id_organizzazione: 'abc', nome: 'X' },
            ruolo_organizzazione: null
        });
        const req = new HttpRequest('GET', '/api/v1/configurazione');
        interceptor.intercept(req, mockHandler);
        expect(lastHandledReq().headers.has(ORG_CONTEXT_HEADER)).toBe(false);
    });

    it('should skip URL containing `/profilo`', () => {
        orgContext.setCurrent({
            organizzazione: { id_organizzazione: 'abc', nome: 'X' },
            ruolo_organizzazione: null
        });
        const req = new HttpRequest('GET', '/api/v1/profilo');
        interceptor.intercept(req, mockHandler);
        expect(lastHandledReq().headers.has(ORG_CONTEXT_HEADER)).toBe(false);
    });

    it('should preserve other headers when adding the org context', () => {
        orgContext.setCurrent({
            organizzazione: { id_organizzazione: 'xyz', nome: 'X' },
            ruolo_organizzazione: null
        });
        const baseReq = new HttpRequest('GET', '/api/v1/utenti');
        const req = baseReq.clone({ headers: baseReq.headers.set('Authorization', 'Bearer token') });
        interceptor.intercept(req, mockHandler);
        const sent = lastHandledReq();
        expect(sent.headers.get(ORG_CONTEXT_HEADER)).toBe('xyz');
        expect(sent.headers.get('Authorization')).toBe('Bearer token');
    });
});
