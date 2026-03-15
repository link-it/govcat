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
import { OAuthService, OAuthErrorEvent } from 'angular-oauth2-oidc';
import { Subject } from 'rxjs';

describe('ConfigService', () => {
    let service: ConfigService;
    let httpMock: HttpTestingController;
    let oauthEvents$: Subject<any>;

    const createMockOAuthService = () => {
        oauthEvents$ = new Subject<any>();
        return {
            configure: vi.fn(),
            setupAutomaticSilentRefresh: vi.fn(),
            loadDiscoveryDocumentAndTryLogin: vi.fn().mockReturnValue(Promise.resolve()),
            tryLogin: vi.fn().mockReturnValue(Promise.resolve()),
            hasValidAccessToken: vi.fn().mockReturnValue(false),
            events: oauthEvents$.asObservable(),
            initCodeFlow: vi.fn()
        };
    };

    let mockOAuthService: ReturnType<typeof createMockOAuthService>;

    beforeEach(() => {
        mockOAuthService = createMockOAuthService();
        TestBed.configureTestingModule({
            imports: [],
            providers: [
                ConfigService,
                { provide: OAuthService, useValue: mockOAuthService },
                provideHttpClient(withInterceptorsFromDi()),
                provideHttpClientTesting()
            ]
        });

        service = TestBed.inject(ConfigService);
        httpMock = TestBed.inject(HttpTestingController);

        vi.spyOn(Tools, 'SetThemeColors').mockImplementation(() => {});
        vi.spyOn(Tools, 'LoginAccess').mockImplementation(() => {});
    });

    afterEach(() => {
        httpMock.verify();
        vi.restoreAllMocks();
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should load configuration without OAuth config', async () => {
        const mockConfig = { AppConfig: { CurrentThems: 'default', Themes: [{ Name: 'default' }] } };
        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(service.getConfiguration()).toEqual(mockConfig);
        expect(Tools.LoginAccess).toHaveBeenCalled();
    });

    it('should load configuration with OAuth Issuer (discovery document)', async () => {
        mockOAuthService.hasValidAccessToken.mockReturnValue(true);
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        RedirectUri: 'http://redirect',
                        LogoutRedirectUri: 'http://logout',
                        ClientId: 'client-123',
                        ResponseType: 'code',
                        Scope: 'openid'
                    }
                }
            }
        };

        const tokenLoadedSpy = vi.spyOn(service, '_tokenLoaded').mockImplementation(() => {});
        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(mockOAuthService.configure).toHaveBeenCalled();
        expect(mockOAuthService.setupAutomaticSilentRefresh).toHaveBeenCalled();
        expect(mockOAuthService.loadDiscoveryDocumentAndTryLogin).toHaveBeenCalled();
        expect(tokenLoadedSpy).toHaveBeenCalled();
    });

    it('should load configuration with OAuth without Issuer (manual endpoints)', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        LoginUrl: 'http://login',
                        TokenEndpoint: 'http://token',
                        UserinfoEndpoint: 'http://userinfo',
                        LogoutUrl: 'http://logout',
                        RevocationEndpoint: 'http://revoke',
                        ClientId: 'client-123'
                    }
                }
            }
        };

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(mockOAuthService.configure).toHaveBeenCalled();
        expect(mockOAuthService.tryLogin).toHaveBeenCalled();
        expect(Tools.LoginAccess).toHaveBeenCalled();
    });

    it('should load configuration with OAuth DummyClientSecret', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123',
                        DummyClientSecret: 'secret-dummy'
                    }
                }
            }
        };

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        const configureCall = mockOAuthService.configure.mock.calls[0][0];
        expect(configureCall.dummyClientSecret).toBe('secret-dummy');
    });

    it('should load configuration with OAuth StrictDiscoveryDocumentValidation=false', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123',
                        StrictDiscoveryDocumentValidation: false
                    }
                }
            }
        };

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        const configureCall = mockOAuthService.configure.mock.calls[0][0];
        expect(configureCall.strictDiscoveryDocumentValidation).toBe(false);
    });

    it('should load configuration with BackdoorOAuth=true', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123',
                        BackdoorOAuth: true
                    }
                }
            }
        };

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(Tools.LoginAccess).toHaveBeenCalled();
        expect(mockOAuthService.configure).not.toHaveBeenCalled();
    });

    it('should handle OAuth login promise rejection', async () => {
        mockOAuthService.loadDiscoveryDocumentAndTryLogin.mockReturnValue(Promise.reject('OAuth error'));
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123'
                    }
                }
            }
        };

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(warnSpy).toHaveBeenCalledWith('OAuth initialization error:', 'OAuth error');
        expect(Tools.LoginAccess).toHaveBeenCalled();
    });

    it('should handle OAuthErrorEvent with reason', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123'
                    }
                }
            }
        };

        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        // Emit an OAuthErrorEvent
        const errorEvent = new OAuthErrorEvent('token_error', { reason: 'some error reason' } as any);
        oauthEvents$.next(errorEvent);

        expect(warnSpy).toHaveBeenCalled();
    });

    it('should handle session_terminated event', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123'
                    }
                }
            }
        };

        const sessionSpy = vi.spyOn(service, '_sessionTerminated').mockImplementation(() => {});

        const promise = service.load('url');

        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        oauthEvents$.next({ type: 'session_terminated' });

        expect(sessionSpy).toHaveBeenCalled();
    });

    it('_tokenLoaded should emit on OpenIDConnectTokenLoaded', () => {
        const nextSpy = vi.spyOn(Tools.OpenIDConnectTokenLoaded, 'next');
        service._tokenLoaded();
        expect(nextSpy).toHaveBeenCalledWith(true);
    });

    it('_sessionTerminated should clear USER_LOGGED and initCodeFlow', () => {
        Tools.USER_LOGGED = { name: 'test' };
        service._sessionTerminated();
        expect(Tools.USER_LOGGED).toBeNull();
        expect(mockOAuthService.initCodeFlow).toHaveBeenCalled();
    });

    it('should get configuration', () => {
        const mockConfig = { AppConfig: { CurrentThems: 'default', Themes: [{ Name: 'default' }] } };
        service['config'] = mockConfig;
        expect(service.getConfiguration()).toEqual(mockConfig);
    });

    it('should load remote configuration', () => {
        const mockConfig = { AppConfig: { GOVAPI: { HOST: 'http://example.com' } } };
        const mockResponse = { servizio: { api: { proprieta_custom: [] } } };
        service['config'] = mockConfig;

        const resolveSpy = vi.fn();
        service.loadRemoteConfig(resolveSpy);

        const req = httpMock.expectOne('http://example.com/configurazione');
        expect(req.request.method).toBe('GET');
        req.flush(mockResponse);

        expect(Tools.Configurazione).toEqual(mockResponse);
        expect(resolveSpy).toHaveBeenCalled();
    });

    it('should load remote configuration with null resolve', () => {
        const mockConfig = { AppConfig: { GOVAPI: { HOST: 'http://example.com' } } };
        const mockResponse = { servizio: { api: { proprieta_custom: [] } } };
        service['config'] = mockConfig;

        service.loadRemoteConfig(null);

        const req = httpMock.expectOne('http://example.com/configurazione');
        req.flush(mockResponse);

        expect(Tools.Configurazione).toEqual(mockResponse);
    });

    it('should generate custom field labels from servizio', () => {
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
                        }
                    ]
                }
            }
        };

        service['_generateCustomFieldLabel'](mockConfig);

        expect(Tools.CustomFieldsLabel).toEqual([
            { label: 'group1.name1', value: 'label1' },
            { label: 'group1.name2', value: 'label2' }
        ]);
    });

    it('should generate custom field labels from adesione', () => {
        const mockConfig = {
            adesione: {
                proprieta_custom: [
                    {
                        nome_gruppo: 'adesione_group',
                        proprieta: [
                            { nome: 'field1', etichetta: 'Etichetta 1' }
                        ]
                    }
                ]
            }
        };

        service['_generateCustomFieldLabel'](mockConfig);

        expect(Tools.CustomFieldsLabel).toEqual([
            { label: 'adesione_group.field1', value: 'Etichetta 1' }
        ]);
    });

    it('should generate custom field labels from both servizio and adesione', () => {
        const mockConfig = {
            servizio: {
                api: {
                    proprieta_custom: [
                        {
                            nome_gruppo: 'svc_group',
                            proprieta: [{ nome: 'f1', etichetta: 'E1' }]
                        }
                    ]
                }
            },
            adesione: {
                proprieta_custom: [
                    {
                        nome_gruppo: 'ade_group',
                        proprieta: [{ nome: 'f2', etichetta: 'E2' }]
                    }
                ]
            }
        };

        service['_generateCustomFieldLabel'](mockConfig);

        expect(Tools.CustomFieldsLabel).toEqual([
            { label: 'svc_group.f1', value: 'E1' },
            { label: 'ade_group.f2', value: 'E2' }
        ]);
    });

    it('should generate empty custom field labels when no proprieta_custom', () => {
        service['_generateCustomFieldLabel']({});
        expect(Tools.CustomFieldsLabel).toEqual([]);
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

    it('should get config with custom suffix', () => {
        const mockConfig = { key: 'value' };
        service['CacheConfig'] = {};

        service.getConfig('myconfig', '-custom').subscribe(response => {
            expect(response).toEqual(mockConfig);
        });

        const req = httpMock.expectOne('./assets/config/myconfig-custom.json');
        req.flush(mockConfig);
    });

    it('should get JSON', () => {
        const mockJson = { key: 'value' };
        service['config'] = { AppConfig: { DELAY: 0 } };

        service.getJson('json1').subscribe(response => {
            expect(response).toEqual(mockJson);
        });

        const req = httpMock.expectOne('./assets/json/json1.json');
        expect(req.request.method).toBe('GET');
        req.flush(mockJson);
    });

    it('should get page with default folder', () => {
        const mockPage = '<html></html>';

        service.getPage('page1').subscribe(response => {
            expect(response).toEqual(mockPage);
        });

        const req = httpMock.expectOne('./assets/pages/page1.html');
        expect(req.request.method).toBe('GET');
        req.flush(mockPage);
    });

    it('should get page with custom folder', () => {
        const mockPage = '<div>content</div>';

        service.getPage('help', 'docs').subscribe(response => {
            expect(response).toEqual(mockPage);
        });

        const req = httpMock.expectOne('./assets/docs/help.html');
        req.flush(mockPage);
    });

    describe('loadThemeFont', () => {
        it('should not do anything if theme has no FontName', async () => {
            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'default',
                    Themes: [{ Name: 'default' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            // No error means the method handled the missing FontName gracefully
            expect(Tools.SetThemeColors).toHaveBeenCalled();
        });

        it('should not do anything if Fonts array is missing', async () => {
            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'MyFont' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(Tools.SetThemeColors).toHaveBeenCalled();
        });

        it('should warn if font is not found in Fonts array', async () => {
            const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'NonExistent' }],
                    Fonts: [{ Name: 'OtherFont', CssFile: 'other.css', FontFamily: 'Other' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(warnSpy).toHaveBeenCalledWith('Font "NonExistent" not found in configuration');
        });

        it('should load font CSS and apply font family', async () => {
            const mockCreateElement = vi.spyOn(document, 'createElement');
            const mockAppendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => el);
            const mockSetProperty = vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});

            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'MyFont' }],
                    Fonts: [{ Name: 'MyFont', CssFile: 'fonts/myfont.css', FontFamily: '"My Font", sans-serif' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(mockSetProperty).toHaveBeenCalledWith('--font-family-base', '"My Font", sans-serif');
            expect(mockAppendChild).toHaveBeenCalled();
        });

        it('should load font CSS without FontFamily', async () => {
            const mockAppendChild = vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => el);

            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'MyFont' }],
                    Fonts: [{ Name: 'MyFont', CssFile: 'fonts/myfont.css' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(mockAppendChild).toHaveBeenCalled();
        });

        it('should remove existing font CSS link before adding new one', async () => {
            const existingLink = document.createElement('link');
            existingLink.id = 'theme-font-css';
            document.head.appendChild(existingLink);

            const removeSpy = vi.spyOn(existingLink, 'remove');
            vi.spyOn(document.head, 'appendChild').mockImplementation((el: any) => el);

            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'MyFont' }],
                    Fonts: [{ Name: 'MyFont', CssFile: 'fonts/myfont.css' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(removeSpy).toHaveBeenCalled();
        });

        it('should apply FontFamily without CssFile', async () => {
            const mockSetProperty = vi.spyOn(document.documentElement.style, 'setProperty').mockImplementation(() => {});

            const mockConfig = {
                AppConfig: {
                    CurrentThems: 'themed',
                    Themes: [{ Name: 'themed', FontName: 'MyFont' }],
                    Fonts: [{ Name: 'MyFont', FontFamily: 'Arial, sans-serif' }]
                }
            };

            const promise = service.load('url');
            const req = httpMock.expectOne('url');
            req.flush(mockConfig);
            await promise;

            expect(mockSetProperty).toHaveBeenCalledWith('--font-family-base', 'Arial, sans-serif');
        });
    });

    it('should load with OAuth without valid token calls LoginAccess', async () => {
        mockOAuthService.hasValidAccessToken.mockReturnValue(false);
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'default',
                Themes: [{ Name: 'default' }],
                AUTH_SETTINGS: {
                    OAUTH: {
                        Issuer: 'https://issuer.example.com',
                        ClientId: 'client-123'
                    }
                }
            }
        };

        const promise = service.load('url');
        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(Tools.LoginAccess).toHaveBeenCalled();
    });

    it('should handle Fonts as non-array gracefully', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'themed',
                Themes: [{ Name: 'themed', FontName: 'MyFont' }],
                Fonts: 'not-an-array'
            }
        };

        const promise = service.load('url');
        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        // Should not throw
        expect(Tools.SetThemeColors).toHaveBeenCalled();
    });

    it('should handle theme not found in Themes array', async () => {
        const mockConfig = {
            AppConfig: {
                CurrentThems: 'nonexistent',
                Themes: [{ Name: 'default' }]
            }
        };

        const promise = service.load('url');
        const req = httpMock.expectOne('url');
        req.flush(mockConfig);
        await promise;

        expect(Tools.SetThemeColors).toHaveBeenCalledWith(null);
    });
});
