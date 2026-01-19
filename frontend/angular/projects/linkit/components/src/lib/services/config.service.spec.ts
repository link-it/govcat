/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConfigService } from './config.service';
import { Tools } from './tools.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ConfigService', () => {
    let service: ConfigService;
    let httpMock: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
    imports: [],
    providers: [ConfigService, provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
});

        service = TestBed.inject(ConfigService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify(); // Ensure that there are no outstanding requests
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load configuration', () => {
        const mockConfig = { AppConfig: { CurrentThems: 'default', Themes: [{ Name: 'default' }] } };
        service.load('url').then(() => {
            expect(service.getConfiguration()).toEqual(mockConfig);
        });

        const req = httpMock.expectOne('url');
        expect(req.request.method).toBe('GET');
        req.flush(mockConfig);
    });

    it('should get configuration', () => {
        const mockConfig = { AppConfig: { CurrentThems: 'default', Themes: [{ Name: 'default' }] } };
        service['config'] = mockConfig;
        expect(service.getConfiguration()).toEqual(mockConfig);
    });

    it('should load remote configuration', () => {
        const mockConfig = { AppConfig: { PDC_CONSOLE: { HOST: 'http://example.com' } } };
        const mockResponse = { servizio: { api: { proprieta_custom: [] } } };
        service['config'] = mockConfig;

        const resolveSpy = jasmine.createSpy('resolve');
        service.loadRemoteConfig(resolveSpy);

        const req = httpMock.expectOne('http://example.com/configurazione');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);

        expect(Tools.Configurazione).toEqual(mockResponse);
        expect(resolveSpy).toHaveBeenCalled();
    });

    it('should generate custom field labels', () => {
        const mockConfig = {
            servizio: {
                api: {
                    proprieta_custom: [
                        {
                            nome_gruppo: 'group1',
                            proprieta: [
                                { nome: 'name1', etichetta: 'label1' },
                                { nome: 'name2', etichetta: 'label2' }
                            ]
                        },
                        {
                            nome_gruppo: 'group2',
                            proprieta: [
                                { nome: 'name3', etichetta: 'label3' },
                                { nome: 'name4', etichetta: 'label4' }
                            ]
                        }
                    ]
                }
            }
        };

        service['_generateCustomFieldLabel'](mockConfig);

        const expectedLabels = [
            { label: 'group1.name1', value: 'label1' },
            { label: 'group1.name2', value: 'label2' },
            { label: 'group2.name3', value: 'label3' },
            { label: 'group2.name4', value: 'label4' }
        ];

        expect(Tools.CustomFiledsLabel).toEqual(expectedLabels);
    });

    it('should get app config', () => {
        const mockConfig = { AppConfig: { CurrentThems: 'default', Themes: [{ Name: 'default' }] } };
        service['config'] = mockConfig;
        expect(service.getAppConfig()).toEqual(mockConfig.AppConfig);
    });

    it('should get dominio when there is only one', () => {
        const mockConfig = { AppConfig: { DOMINI: [{ label: 'dominio1' }] } };
        service['config'] = mockConfig;
        expect(service.getDominio()).toEqual('dominio1');
    });

    it('should get default dominio when there is more than one', () => {
        const mockConfig = { AppConfig: { DOMINI: [{ label: 'dominio1' }, { label: 'dominio2' }] } };
        service['config'] = mockConfig;
        expect(service.getDominio()).toEqual('<Dominio non configurato>');
    });

    it('should get session prefix', () => {
        const mockConfig = { sessionPrefix: 'prefix' };
        service['config'] = mockConfig;
        expect(service.getSessionPrefix()).toEqual('prefix');
    });

    it('should get config from cache', () => {
        const mockConfig = { key: 'value' };
        service['CacheConfig'] = { config1: mockConfig };

        service.getConfig('config1').subscribe(response => {
            expect(response).toEqual(mockConfig);
        });
    });

    it('should get config from HTTP request', () => {
        const mockConfig = { key: 'value' };
        service['CacheConfig'] = {};

        service.getConfig('config1').subscribe(response => {
            expect(response).toEqual(mockConfig);
            expect(service['CacheConfig']['config1']).toEqual(mockConfig);
        });

        const req = httpMock.expectOne('./assets/config/config1-config.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockConfig);
    });

    it('should get JSON', () => {
        const mockJson = { key: 'value' };
        service['config'] = { AppConfig: { DELAY: 0 } }; // Add this line

        service.getJson('json1').subscribe(response => {
            expect(response).toEqual(mockJson);
        });

        const req = httpMock.expectOne('./assets/json/json1.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockJson);
    });

    it('should get page', () => {
        const mockPage = '<html></html>';

        service.getPage('page1').subscribe(response => {
            expect(response).toEqual(mockPage);
        });

        const req = httpMock.expectOne('./assets/pages/page1.html');
        expect(req.request.method).toBe('GET');
        req.flush(mockPage);
    });
});