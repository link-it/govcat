import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OAuthService } from 'angular-oauth2-oidc';
import { ConfigService, EventsManagerService, Tools } from '@linkit/components';
import { PermessiService } from './permessi.service';
import { AuthenticationService, AUTH_CONST } from './authentication.service';

describe('AuthenticationService', () => {
  let service: AuthenticationService;
  let httpMock: HttpTestingController;
  let oauthService: any;
  let configService: any;
  let eventsManagerService: any;

  const mockConfig = {
    AppConfig: {
      GOVAPI: { HOST: '/api/v1', HOST_PDND: '/pdnd/v1', HOST_MONITOR: '/monitor/v1' },
      ANONYMOUS_ACCESS: false,
      AUTH_SETTINGS: {}
    }
  };

  beforeEach(() => {
    oauthService = {
      hasValidIdToken: vi.fn().mockReturnValue(false),
      hasValidAccessToken: vi.fn().mockReturnValue(false),
      getAccessToken: vi.fn().mockReturnValue(null),
      revokeTokenAndLogout: vi.fn().mockResolvedValue(undefined),
      logOut: vi.fn(),
      initCodeFlow: vi.fn()
    };
    configService = {
      getConfiguration: vi.fn().mockReturnValue(mockConfig),
      getAppConfig: vi.fn().mockReturnValue(mockConfig.AppConfig)
    };
    eventsManagerService = { broadcast: vi.fn() };

    localStorage.removeItem(AUTH_CONST.storageSession);

    TestBed.configureTestingModule({
      providers: [
        AuthenticationService,
        PermessiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: OAuthService, useValue: oauthService },
        { provide: ConfigService, useValue: configService },
        { provide: EventsManagerService, useValue: eventsManagerService }
      ]
    });

    service = TestBed.inject(AuthenticationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.removeItem(AUTH_CONST.storageSession);
    vi.restoreAllMocks();
  });

  describe('session management', () => {
    it('should set and get session from localStorage', () => {
      const session = { principal: 'user', roles: ['admin'], utente: { id_utente: '1', nome: 'Test', cognome: 'User', ruolo: 'gestore' } };
      service.setCurrentSession(session);
      const result = service.getCurrentSession();
      expect(result.principal).toBe('user');
      expect(result.utente.ruolo).toBe('gestore');
    });

    it('should return null when no session exists', () => {
      expect(service.getCurrentSession()).toBeNull();
    });

    it('should reload session and broadcast event', () => {
      const session = { principal: 'user', roles: [] };
      service.setCurrentSession(session);
      const result = service.reloadSession();
      expect(result.principal).toBe('user');
      expect(eventsManagerService.broadcast).toHaveBeenCalled();
    });
  });

  describe('user info', () => {
    const session = {
      principal: 'user',
      roles: ['apicat_adm'],
      utente: { id_utente: '1', nome: 'Admin', cognome: 'Test', ruolo: 'gestore', email: 'admin@test.it' }
    };

    it('should return user from session', () => {
      service.setCurrentSession(session);
      expect(service.getUser().nome).toBe('Admin');
    });

    it('should return null when no user in session', () => {
      expect(service.getUser()).toBeNull();
    });

    it('should return user name', () => {
      service.setCurrentSession(session);
      expect(service.getUserName()).toBe('Admin Test');
    });

    it('should return "sconosciuto" when no user', () => {
      expect(service.getUserName()).toBe('sconosciuto');
    });

    it('should get role', () => {
      service.setCurrentSession(session);
      expect(service.getRole()).toBe('gestore');
    });

    it('should return null role when no session', () => {
      expect(service.getRole()).toBeNull();
    });
  });

  describe('role checks', () => {
    it('should check hasRole', () => {
      service.setCurrentSession({ principal: 'u', roles: [], utente: { id_utente: '1', nome: 'A', cognome: 'B', ruolo: 'referente' } });
      expect(service.hasRole(['referente', 'gestore'])).toBe(true);
      expect(service.hasRole(['gestore'])).toBe(false);
    });

    it('should check isGestore from user role', () => {
      service.setCurrentSession({ principal: 'u', roles: [], utente: { id_utente: '1', nome: 'A', cognome: 'B', ruolo: 'gestore' } });
      expect(service.isGestore()).toBe(true);
    });

    it('should check isGestore from grant array', () => {
      expect(service.isGestore(['gestore'])).toBe(true);
      // Without 'gestore' in grant and no user session, indexOf returns -1 so _isGestore stays false
      // But getUser() is null so _user.ruolo check is skipped, returns false
      expect(service.isGestore(['referente'])).toBeFalsy();
    });

    it('should check isCoordinatore', () => {
      service.setCurrentSession({ principal: 'u', roles: [], utente: { id_utente: '1', nome: 'A', cognome: 'B', ruolo: 'coordinatore' } });
      expect(service.isCoordinatore()).toBe(true);
    });

    it('should identify anonymous users', () => {
      expect(service.isAnonymous()).toBe(true);
      service.setCurrentSession({ principal: 'u', roles: [], utente: { id_utente: '1', nome: 'A', cognome: 'B', ruolo: 'r' } });
      expect(service.isAnonymous()).toBe(false);
    });
  });

  describe('login', () => {
    it('should send GET to /profile with Basic auth header', () => {
      service.login('admin', 'secret').subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/profile'));
      expect(req.request.method).toBe('GET');
      const authHeader = req.request.headers.get('Authorization');
      expect(authHeader).toBe('Basic ' + btoa('admin:secret'));
      req.flush({ principal: 'admin' });
    });
  });

  describe('logout', () => {
    it('should remove session from localStorage', () => {
      service.setCurrentSession({ principal: 'u', roles: [] });
      service.logout();
      expect(localStorage.getItem(AUTH_CONST.storageSession)).toBeNull();
    });
  });

  describe('isLogged', () => {
    it('should return true when backdoorOAuth is true', () => {
      (service as any).backdoorOAuth = true;
      expect(service.isLogged()).toBe(true);
    });

    it('should return true when anonymousAccess is true', () => {
      (service as any).anonymousAccess = true;
      expect(service.isLogged()).toBe(true);
    });

    it('should delegate to isAuthLogged when no backdoor and no anonymous', () => {
      (service as any).backdoorOAuth = false;
      (service as any).anonymousAccess = false;
      oauthService.hasValidIdToken.mockReturnValue(true);
      oauthService.hasValidAccessToken.mockReturnValue(true);
      expect(service.isLogged()).toBe(true);
    });

    it('should return false when OAuth tokens are invalid', () => {
      (service as any).backdoorOAuth = false;
      (service as any).anonymousAccess = false;
      expect(service.isLogged()).toBe(false);
    });
  });
});
