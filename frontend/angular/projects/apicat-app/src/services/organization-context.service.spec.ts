/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 */
import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ConfigService } from '@linkit/components';

import { OrganizationContextService } from './organization-context.service';
import { RuoloOrganizzazioneEnum } from '../model/ruoloOrganizzazioneEnum';

const STORAGE_KEY = 'govcat.organizationContext';

const orgA = { id_organizzazione: 'org-A', nome: 'Org A' };
const orgB = { id_organizzazione: 'org-B', nome: 'Org B' };

describe('OrganizationContextService', () => {
    let service: OrganizationContextService;
    let mockConfigService: any;

    beforeEach(() => {
        localStorage.clear();
        mockConfigService = {
            getConfiguration: vi.fn().mockReturnValue({
                AppConfig: {
                    Organization: {
                        ContextSelector: { storageKey: STORAGE_KEY }
                    }
                }
            })
        };
        TestBed.configureTestingModule({
            providers: [
                OrganizationContextService,
                { provide: ConfigService, useValue: mockConfigService }
            ]
        });
        service = TestBed.inject(OrganizationContextService);
    });

    it('should be created with empty context by default', () => {
        expect(service).toBeTruthy();
        expect(service.getCurrent()).toBeNull();
        expect(service.getCurrentOrganization()).toBeNull();
        expect(service.getCurrentRole()).toBeNull();
    });

    it('setCurrent should update value and persist on localStorage', () => {
        const ctx = { organizzazione: orgA, ruolo_organizzazione: RuoloOrganizzazioneEnum.AmministratoreOrganizzazione };
        service.setCurrent(ctx);
        expect(service.getCurrent()).toEqual(ctx);
        expect(service.getCurrentOrganization()?.id_organizzazione).toBe('org-A');
        expect(service.getCurrentRole()).toBe(RuoloOrganizzazioneEnum.AmministratoreOrganizzazione);
        const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
        expect(persisted.id_organizzazione).toBe('org-A');
    });

    it('setCurrent(null) should clear localStorage', () => {
        service.setCurrent({ organizzazione: orgA, ruolo_organizzazione: null });
        expect(localStorage.getItem(STORAGE_KEY)).not.toBeNull();
        service.setCurrent(null);
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(service.getCurrent()).toBeNull();
    });

    it('clear() should reset context and remove persistence', () => {
        service.setCurrent({ organizzazione: orgA, ruolo_organizzazione: null });
        service.clear();
        expect(service.getCurrent()).toBeNull();
        expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    it('current$ observable should emit on setCurrent', () => {
        const emitted: any[] = [];
        service.current$.subscribe(v => emitted.push(v));
        service.setCurrent({ organizzazione: orgA, ruolo_organizzazione: null });
        service.setCurrent({ organizzazione: orgB, ruolo_organizzazione: RuoloOrganizzazioneEnum.OperatoreApi });
        expect(emitted.length).toBe(3); // initial null + due set
        expect(emitted[0]).toBeNull();
        expect(emitted[1].organizzazione.id_organizzazione).toBe('org-A');
        expect(emitted[2].organizzazione.id_organizzazione).toBe('org-B');
    });

    describe('initFromUser', () => {
        it('should select first organization when no persisted context', () => {
            const utente: any = {
                organizzazioni: [
                    { organizzazione: orgA, ruolo_organizzazione: RuoloOrganizzazioneEnum.OperatoreApi },
                    { organizzazione: orgB, ruolo_organizzazione: null }
                ]
            };
            service.initFromUser(utente);
            expect(service.getCurrentOrganization()?.id_organizzazione).toBe('org-A');
        });

        it('should restore persisted organization when present in user list', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ id_organizzazione: 'org-B' }));
            // Re-create service so it reads the storageKey
            service = TestBed.inject(OrganizationContextService);
            const utente: any = {
                organizzazioni: [
                    { organizzazione: orgA, ruolo_organizzazione: null },
                    { organizzazione: orgB, ruolo_organizzazione: RuoloOrganizzazioneEnum.AmministratoreOrganizzazione }
                ]
            };
            service.initFromUser(utente);
            expect(service.getCurrentOrganization()?.id_organizzazione).toBe('org-B');
            expect(service.getCurrentRole()).toBe(RuoloOrganizzazioneEnum.AmministratoreOrganizzazione);
        });

        it('should fall back to first when persisted id is no longer in list', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ id_organizzazione: 'unknown-id' }));
            service = TestBed.inject(OrganizationContextService);
            const utente: any = {
                organizzazioni: [
                    { organizzazione: orgA, ruolo_organizzazione: null }
                ]
            };
            service.initFromUser(utente);
            expect(service.getCurrentOrganization()?.id_organizzazione).toBe('org-A');
        });

        it('should map legacy single `organizzazione` to a single-entry context with null role', () => {
            const utente: any = {
                organizzazione: { id_organizzazione: 'legacy', nome: 'Legacy', referente: true, aderente: true }
            };
            service.initFromUser(utente);
            const cur = service.getCurrent();
            expect(cur?.organizzazione.id_organizzazione).toBe('legacy');
            expect(cur?.organizzazione.referente).toBe(true);
            expect(cur?.ruolo_organizzazione).toBeNull();
        });

        it('should clear context when user has no organizations', () => {
            service.setCurrent({ organizzazione: orgA, ruolo_organizzazione: null });
            service.initFromUser({} as any);
            expect(service.getCurrent()).toBeNull();
            expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
        });

        it('should handle null/undefined user gracefully', () => {
            service.initFromUser(null);
            expect(service.getCurrent()).toBeNull();
            service.initFromUser(undefined);
            expect(service.getCurrent()).toBeNull();
        });
    });

    it('uses the default storage key when config does not provide one', () => {
        mockConfigService.getConfiguration.mockReturnValue({});
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                OrganizationContextService,
                { provide: ConfigService, useValue: mockConfigService }
            ]
        });
        const fresh = TestBed.inject(OrganizationContextService);
        fresh.setCurrent({ organizzazione: orgA, ruolo_organizzazione: null });
        expect(localStorage.getItem('govcat.organizationContext')).not.toBeNull();
    });
});
