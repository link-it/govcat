import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, Subject } from 'rxjs';
import { ClientDetailsComponent } from './client-details.component';
import { Tools } from '@linkit/components';

describe('ClientDetailsComponent', () => {
  let component: ClientDetailsComponent;
  let savedConfigurazione: any;

  let mockRoute: any;
  let mockRouter: any;
  let mockTranslate: any;
  let mockModalService: any;
  let mockConfigService: any;
  let mockTools: any;
  let mockApiService: any;
  let mockAuthenticationService: any;
  let mockUtils: any;
  let mockEventsManagerService: any;

  beforeEach(() => {
    savedConfigurazione = Tools.Configurazione;
    Tools.Configurazione = {
      servizio: {
        api: { auth_type: [{ type: 'https', indirizzi_ip: false, rate_limiting: false, finalita: false }], abilitato: true },
        generico: { abilitato: false }
      }
    };

    mockRoute = {
      params: of({ id: '123' }),
      queryParams: of({}),
      data: of({})
    };
    mockRouter = {
      navigate: vi.fn(),
      url: '/client/123'
    };
    mockTranslate = {
      instant: vi.fn((key: string) => key)
    };
    mockModalService = {
      show: vi.fn()
    };
    mockConfigService = {
      getConfiguration: vi.fn().mockReturnValue({
        AppConfig: {
          GOVAPI: { HOST: 'http://localhost' },
          Services: {},
          Layout: {}
        }
      }),
      getConfig: vi.fn().mockReturnValue(of({}))
    };
    mockTools = {};
    mockApiService = {
      getList: vi.fn().mockReturnValue(of({ content: [] })),
      getDetails: vi.fn().mockReturnValue(of({})),
      saveElement: vi.fn().mockReturnValue(of({})),
      putElement: vi.fn().mockReturnValue(of({})),
      deleteElement: vi.fn().mockReturnValue(of({})),
      putElementRelated: vi.fn().mockReturnValue(of({})),
      download: vi.fn().mockReturnValue(of({ body: new Blob() }))
    };
    mockAuthenticationService = {
      _getConfigModule: vi.fn((module: string) => {
        if (module === 'servizio') return { api: { auth_type: [{ type: 'https' }], abilitato: true }, generico: { abilitato: false } };
        if (module === 'monitoraggio') return { abilitato: false, verifiche_abilitate: false };
        return {};
      }),
      hasPermission: vi.fn().mockReturnValue(true)
    };
    mockUtils = {
      GetErrorMsg: vi.fn().mockReturnValue('Error'),
      getCertificatoByAuthType: vi.fn().mockReturnValue(null),
      getTipiCertificatoAttivi: vi.fn().mockReturnValue([])
    };
    mockEventsManagerService = {
      on: vi.fn(),
      broadcast: vi.fn(),
      off: vi.fn()
    };

    component = new ClientDetailsComponent(
      mockRoute as any,
      mockRouter as any,
      mockTranslate as any,
      mockModalService as any,
      mockConfigService as any,
      mockTools as any,
      mockApiService as any,
      mockAuthenticationService as any,
      mockUtils as any,
      mockEventsManagerService as any
    );
  });

  afterEach(() => {
    Tools.Configurazione = savedConfigurazione;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(ClientDetailsComponent.Name).toBe('ClientDetailsComponent');
  });

  it('should have model set to client', () => {
    expect(component.model).toBe('client');
  });

  it('should set appConfig from configService', () => {
    expect(component.appConfig).toBeDefined();
    expect(mockConfigService.getConfiguration).toHaveBeenCalled();
  });

  it('should have default values', () => {
    expect(component.id).toBeNull();
    expect(component._isDetails).toBe(true);
    expect(component._isEdit).toBe(false);
    expect(component._isNew).toBe(false);
    expect(component._spin).toBe(true);
    expect(component._error).toBe(false);
    expect(component._currentTab).toBe('details');
    expect(component.hasTab).toBe(true);
    expect(component._useRoute).toBe(true);
  });

  it('should have close and save EventEmitters', () => {
    expect(component.close).toBeDefined();
    expect(component.save).toBeDefined();
  });

  describe('_initBreadcrumb', () => {
    it('should set breadcrumbs with client name', () => {
      component.client = { nome: 'TestClient' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(3);
      expect(component.breadcrumbs[2].label).toBe('TestClient');
    });

    it('should set breadcrumbs with id when no client', () => {
      component.client = null;
      component.id = 42 as any;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('42');
    });

    it('should set breadcrumbs for new client', () => {
      component.client = null;
      component.id = null;
      component._initBreadcrumb();
      expect(component.breadcrumbs[2].label).toBe('APP.TITLE.New');
    });

    it('should set dashboard breadcrumb when _fromDashboard is true', () => {
      component._fromDashboard = true;
      component.client = { nome: 'TestClient' };
      component._initBreadcrumb();
      expect(component.breadcrumbs.length).toBe(2);
      expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
    });
  });

  describe('_clickTab', () => {
    it('should change current tab', () => {
      component._clickTab('info');
      expect(component._currentTab).toBe('info');
    });
  });

  describe('_onCancelEdit', () => {
    it('should set _isEdit to false', () => {
      component._isEdit = true;
      component._isNew = false;
      component.client = {
        nome: 'test',
        stato: 'nuovo',
        soggetto: {
          id_soggetto: 's1',
          nome: 'SogTest',
          aderente: true,
          organizzazione: { id_organizzazione: 'o1', nome: 'OrgTest' }
        },
        dati_specifici: {
          auth_type: 'no_dati',
          certificato_autenticazione: null,
          certificato_firma: null
        }
      };
      component._onCancelEdit();
      expect(component._isEdit).toBe(false);
      expect(component._error).toBe(false);
    });

    it('should navigate to model when new and using route', () => {
      component._isNew = true;
      component._useRoute = true;
      component._onCancelEdit();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['client']);
    });

    it('should emit close when new and not using route', () => {
      component._isNew = true;
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onCancelEdit();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('onBreadcrumb', () => {
    it('should navigate when using route', () => {
      component._useRoute = true;
      component.onBreadcrumb({ url: '/client' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/client'], { queryParamsHandling: 'preserve' });
    });

    it('should call _onClose when not using route', () => {
      component._useRoute = false;
      const spy = vi.fn();
      component.close.subscribe(spy);
      component.onBreadcrumb({ url: '/client' });
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onClose / _onSave', () => {
    it('should emit close event', () => {
      const spy = vi.fn();
      component.close.subscribe(spy);
      component._onClose();
      expect(spy).toHaveBeenCalled();
    });

    it('should emit save event', () => {
      const spy = vi.fn();
      component.save.subscribe(spy);
      component._onSave();
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_onSubmit', () => {
    it('should not call save if form is invalid', () => {
      component._isEdit = true;
      component._formGroup.setErrors({ invalid: true });
      component._onSubmit({});
      expect(mockApiService.saveElement).not.toHaveBeenCalled();
    });
  });

  describe('_checkTipoCertificato', () => {
    it('should set _isFornito for https + fornito', () => {
      component._checkTipoCertificato('https', 'fornito');
      expect(component._isFornito).toBe(true);
      expect(component._isRichiesto_cn).toBe(false);
      expect(component._isRichiesto_csr).toBe(false);
    });

    it('should set _isRichiesto_cn for https + richiesto_cn', () => {
      component._checkTipoCertificato('https', 'richiesto_cn');
      expect(component._isFornito).toBe(false);
      expect(component._isRichiesto_cn).toBe(true);
    });

    it('should set _isRichiesto_csr for https + richiesto_csr', () => {
      component._checkTipoCertificato('https', 'richiesto_csr');
      expect(component._isRichiesto_csr).toBe(true);
    });
  });

  describe('_removeNullProperties', () => {
    it('should remove null properties', () => {
      const obj = { a: 1, b: null, c: 'test', d: null };
      component._removeNullProperties(obj);
      expect(obj).toEqual({ a: 1, c: 'test' });
    });
  });

  describe('_isCertificatoEmpty', () => {
    it('should return true for null', () => {
      expect(component._isCertificatoEmpty(null)).toBe(true);
    });

    it('should return true for empty object', () => {
      expect(component._isCertificatoEmpty({})).toBe(true);
    });

    it('should return false for object with keys', () => {
      expect(component._isCertificatoEmpty({ a: 1 })).toBe(false);
    });
  });

  describe('_chekIfCertificateHasUpdated', () => {
    it('should set uuid to null and flag when content present', () => {
      const temp = { content: 'data', uuid: 'abc' };
      component._chekIfCertificateHasUpdated(temp);
      expect(temp.uuid).toBeNull();
      expect(component._isAnyCertificateUpdated).toBe(true);
    });

    it('should not modify when no content', () => {
      component._isAnyCertificateUpdated = false;
      const temp = { uuid: 'abc' };
      component._chekIfCertificateHasUpdated(temp);
      expect(temp.uuid).toBe('abc');
      expect(component._isAnyCertificateUpdated).toBe(false);
    });
  });

  describe('_checkTipoDocumento', () => {
    it('should return uuid when document has uuid', () => {
      expect(component._checkTipoDocumento({ uuid: '123' })).toBe('uuid');
    });

    it('should return nuovo when no uuid', () => {
      expect(component._checkTipoDocumento({})).toBe('nuovo');
    });

    it('should return nuovo for null document', () => {
      expect(component._checkTipoDocumento(null)).toBe('nuovo');
    });
  });

  describe('ngAfterContentChecked', () => {
    it('should set desktop based on window width', () => {
      component.ngAfterContentChecked();
      expect(typeof component.desktop).toBe('boolean');
    });
  });

  describe('_resetDescrittori / _resetDescrittoriFirma', () => {
    it('should reset all descriptors', () => {
      component._descrittoreCtrl.setValue('test');
      component._resetDescrittori();
      expect(component._descrittoreCtrl.value).toBe('');
    });

    it('should reset all firma descriptors', () => {
      component._descrittoreCtrl_firma.setValue('test');
      component._resetDescrittoriFirma();
      expect(component._descrittoreCtrl_firma.value).toBe('');
    });
  });
});
