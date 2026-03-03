import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  const mockRouter = { navigate: vi.fn(), navigateByUrl: vi.fn() } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    }),
    getConfig: vi.fn().mockReturnValue(of({})),
  } as any;
  const mockAuthService = {
    getUser: vi.fn().mockReturnValue({ ruolo: 'gestore' }),
  } as any;
  const mockDashboardService = {
    computeRoleConfig: vi.fn().mockReturnValue({
      servizi: true, adesioni: true, client: true, comunicazioni: true, utenti: true
    }),
    getRuoliProfilo: vi.fn().mockReturnValue(of({ ruolo: 'referente_servizio', ruoli_referente: [] })),
    getServizi: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getAdesioni: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getClient: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getComunicazioni: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
    getUtenti: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 } })),
  } as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue(new HttpParams()),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: { Services: { hideVersions: false } }
    });
    mockConfigService.getConfig.mockReturnValue(of({}));
    mockAuthService.getUser.mockReturnValue({ ruolo: 'gestore' });
    mockDashboardService.computeRoleConfig.mockReturnValue({
      servizi: true, adesioni: true, client: true, comunicazioni: true, utenti: true
    });
    mockDashboardService.getServizi.mockReturnValue(of({ content: [], page: { totalElements: 0 } }));
    mockDashboardService.getAdesioni.mockReturnValue(of({ content: [], page: { totalElements: 0 } }));
    mockDashboardService.getClient.mockReturnValue(of({ content: [], page: { totalElements: 0 } }));
    mockDashboardService.getComunicazioni.mockReturnValue(of({ content: [], page: { totalElements: 0 } }));
    mockDashboardService.getUtenti.mockReturnValue(of({ content: [], page: { totalElements: 0 } }));
    mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
    component = new DashboardComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockAuthService, mockDashboardService, mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(DashboardComponent.Name).toBe('DashboardComponent');
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Dashboard');
  });

  it('should have default roleConfig all false', () => {
    const comp = new DashboardComponent(
      mockRouter, mockTranslate, mockConfigService,
      mockAuthService, mockDashboardService, mockApiService, mockUtils
    );
    expect(comp.roleConfig.servizi).toBe(false);
    expect(comp.roleConfig.adesioni).toBe(false);
  });

  it('should have default loading states false', () => {
    expect(component.loadingServizi).toBe(false);
    expect(component.loadingAdesioni).toBe(false);
    expect(component.loadingClient).toBe(false);
    expect(component.isRefreshing).toBe(false);
  });

  it('should return summary style from sectionsConfig', () => {
    component.sectionsConfig = {
      servizi: { summary: { gradientFrom: '#000', gradientTo: '#fff', textColor: '#333' } }
    };
    const style = component.getSummaryStyle('servizi');
    expect(style['background']).toContain('linear-gradient');
    expect(style['color']).toBe('#333');
  });

  it('should return empty object for unknown section summary style', () => {
    expect(component.getSummaryStyle('unknown')).toEqual({});
  });

  it('should return section icon', () => {
    component.sectionsConfig = { servizi: { icon: 'bi-server' } };
    expect(component.getSectionIcon('servizi')).toBe('bi-server');
    expect(component.getSectionIcon('unknown')).toBe('');
  });

  it('should return section border color', () => {
    component.sectionsConfig = { servizi: { borderColor: '#ff0000' } };
    expect(component.getSectionBorderColor('servizi')).toBe('#ff0000');
    expect(component.getSectionBorderColor('unknown')).toBe('#0d6efd');
  });

  it('should return expanded section title', () => {
    component.expandedSection = 'servizi';
    expect(component.getExpandedSectionTitle()).toBe('APP.DASHBOARD_PENDING.Servizi');
    component.expandedSection = null;
    expect(component.getExpandedSectionTitle()).toBe('');
  });

  it('should return expanded status config', () => {
    component.serviziStatusConfig = { pubblicato: { label: 'P' } };
    component.expandedSection = 'servizi';
    expect(component.getExpandedStatusConfig()).toBe(component.serviziStatusConfig);
    component.expandedSection = null;
    expect(component.getExpandedStatusConfig()).toEqual({});
  });

  it('should get status style', () => {
    component.serviziStatusConfig = { pubblicato: { background: '#28a745', color: '#fff', label: 'P' } };
    component.expandedSection = 'servizi';
    const style = component.getStatusStyle('pubblicato');
    expect(style['background-color']).toBe('#28a745');
  });

  it('should get default status style for unknown stato', () => {
    component.expandedSection = 'servizi';
    const style = component.getStatusStyle('unknown');
    expect(style['background-color']).toBe('#6c757d');
  });

  it('should get status label', () => {
    component.serviziStatusConfig = { pubblicato: { label: 'Pubblicato', background: '', color: '' } };
    component.expandedSection = 'servizi';
    expect(component.getStatusLabel('pubblicato')).toBe('Pubblicato');
    expect(component.getStatusLabel('unknown')).toBe('unknown');
  });

  it('should format date', () => {
    expect(component.formatDate('2026-03-01T12:00:00')).toMatch(/01\/03\/2026/);
    expect(component.formatDate('')).toBe('');
  });

  it('should toggle expanded section on onSummaryClick', () => {
    component.onSummaryClick('servizi');
    expect(component.expandedSection).toBe('servizi');
  });

  it('should collapse expanded section on second click', () => {
    component.expandedSection = 'servizi';
    component.onSummaryClick('servizi');
    expect(component.expandedSection).toBeNull();
  });

  it('should collapse expanded view', () => {
    component.expandedSection = 'servizi';
    component.expandedItems = [{ id: '1' }];
    component.expandedTotal = 10;
    component.onCollapseExpanded();
    expect(component.expandedSection).toBeNull();
    expect(component.expandedItems).toEqual([]);
    expect(component.expandedTotal).toBe(0);
  });

  it('should set expanded filter data on search', () => {
    component.expandedSection = 'servizi';
    component.onExpandedSearch({ q: 'test' });
    expect(component.expandedFilterData).toEqual({ q: 'test' });
  });

  it('should navigate to servizio on onViewItem', () => {
    component.onViewItem({ id_servizio: 's1' }, 'servizi');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi', 's1'], { queryParams: { from: 'dashboard' } });
  });

  it('should navigate to adesione on onViewItem', () => {
    component.onViewItem({ id_adesione: 'a1' }, 'adesioni');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni', 'a1'], { queryParams: { from: 'dashboard' } });
  });

  it('should navigate to client on onViewItem', () => {
    component.onViewItem({ id_client: 'c1' }, 'client');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/client', 'c1'], { queryParams: { from: 'dashboard' } });
  });

  it('should navigate to utente on onViewItem', () => {
    component.onViewItem({ id_utente: 'u1' }, 'utenti');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/utenti', 'u1'], { queryParams: { from: 'dashboard' } });
  });

  it('should navigate to comunicazione servizio', () => {
    component.onViewItem({
      id_notifica: 'n1',
      entita: { id_entita: 'e1', servizio: { id_servizio: 's1' } },
      tipo: { tipo: 'comunicazione' }
    }, 'comunicazioni');
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('/servizi/s1/comunicazioni'));
  });

  it('should navigate to comunicazione adesione', () => {
    component.onViewItem({
      id_notifica: 'n1',
      entita: { id_entita: 'e1', adesione: { id_adesione: 'a1' } },
      tipo: { tipo: 'cambio_stato' }
    }, 'comunicazioni');
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('/adesioni/a1'));
  });

  it('should navigate to notifications when no servizio/adesione', () => {
    component.onViewItem({
      id_notifica: 'n1',
      entita: { id_entita: 'e1' },
      tipo: { tipo: 'comunicazione' }
    }, 'comunicazioni');
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/notifications']);
  });

  it('should set isRefreshing on onRefresh', () => {
    component.onRefresh();
    expect(component.isRefreshing).toBe(true);
  });

  it('should call onViewAll which delegates to onSummaryClick', () => {
    const spy = vi.spyOn(component, 'onSummaryClick');
    component.onViewAll('servizi');
    expect(spy).toHaveBeenCalledWith('servizi');
  });

  // ========== _loadConfigs / ngOnInit ==========

  describe('_loadConfigs / ngOnInit', () => {
    it('should load dashboard config and apply sections on ngOnInit', () => {
      const dashboardCfg = { showSummaryCards: true, sections: { servizi: { icon: 'bi-server' } } };
      mockConfigService.getConfig.mockImplementation((key: string) => {
        if (key === 'dashboard') return of(dashboardCfg);
        return of({});
      });
      component.ngOnInit();
      expect(component.showSummaryCards).toBe(true);
      expect(component.sectionsConfig).toEqual({ servizi: { icon: 'bi-server' } });
    });

    it('should handle null dashboard config gracefully', () => {
      mockConfigService.getConfig.mockReturnValue(of(null));
      component.ngOnInit();
      expect(component.showSummaryCards).toBe(true);
      expect(component.sectionsConfig).toEqual({});
    });

    it('should set hideVersions from app config', () => {
      mockConfigService.getConfiguration.mockReturnValue({
        AppConfig: { Services: { hideVersions: true } }
      });
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component.hideVersions).toBe(true);
    });

    it('should load servizi status config from servizi config', () => {
      const statusValues = { pubblicato: { label: 'Pubblicato', background: '#28a745', color: '#fff' } };
      mockConfigService.getConfig.mockImplementation((key: string) => {
        if (key === 'servizi') return of({ options: { status: { values: statusValues } } });
        return of({});
      });
      component.ngOnInit();
      expect(component.serviziStatusConfig).toEqual(statusValues);
    });

    it('should load client status config merging status and ambient', () => {
      const statusValues = { attivo: { label: 'Attivo' } };
      const ambientValues = { collaudo: { label: 'Collaudo' } };
      mockConfigService.getConfig.mockImplementation((key: string) => {
        if (key === 'client') return of({ options: { status: { values: statusValues }, ambient: { values: ambientValues } } });
        return of({});
      });
      component.ngOnInit();
      expect(component.clientStatusConfig).toEqual({ attivo: { label: 'Attivo' }, collaudo: { label: 'Collaudo' } });
    });
  });

  // ========== _initRoleConfig ==========

  describe('_initRoleConfig', () => {
    it('should use computeRoleConfig directly for gestore role without fetching profilo', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'gestore' });
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.computeRoleConfig).toHaveBeenCalledWith('gestore', []);
      expect(mockDashboardService.getRuoliProfilo).not.toHaveBeenCalled();
    });

    it('should use computeRoleConfig directly for coordinatore role without fetching profilo', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'coordinatore' });
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.computeRoleConfig).toHaveBeenCalledWith('coordinatore', []);
      expect(mockDashboardService.getRuoliProfilo).not.toHaveBeenCalled();
    });

    it('should fetch profilo ruoli for referente_servizio role', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'referente_servizio' });
      mockDashboardService.getRuoliProfilo.mockReturnValue(
        of({ ruolo: 'referente_servizio', ruoli_referente: ['referente_servizio'] })
      );
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.getRuoliProfilo).toHaveBeenCalled();
      expect(mockDashboardService.computeRoleConfig).toHaveBeenCalledWith(
        'referente_servizio', ['referente_servizio']
      );
    });

    it('should fallback to ruolo-only config when profilo fetch fails for referente', () => {
      mockAuthService.getUser.mockReturnValue({ ruolo: 'referente_tecnico' });
      mockDashboardService.getRuoliProfilo.mockReturnValue(throwError(() => new Error('Network error')));
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.computeRoleConfig).toHaveBeenCalledWith('referente_tecnico', []);
    });

    it('should handle null user gracefully and use empty ruolo', () => {
      mockAuthService.getUser.mockReturnValue(null);
      mockDashboardService.getRuoliProfilo.mockReturnValue(
        of({ ruolo: '', ruoli_referente: [] })
      );
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.getRuoliProfilo).toHaveBeenCalled();
    });
  });

  // ========== _loadData ==========

  describe('_loadData', () => {
    it('should load all sections when all roleConfig flags are true', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      mockDashboardService.getServizi.mockReturnValue(of({ content: [{ id: 's1' }], page: { totalElements: 1 } }));
      mockDashboardService.getAdesioni.mockReturnValue(of({ content: [{ id: 'a1' }], page: { totalElements: 2 } }));
      mockDashboardService.getClient.mockReturnValue(of({ content: [{ id: 'c1' }], page: { totalElements: 3 } }));
      mockDashboardService.getComunicazioni.mockReturnValue(of({ content: [{ id: 'n1' }], page: { totalElements: 4 } }));
      mockDashboardService.getUtenti.mockReturnValue(of({ content: [{ id: 'u1' }], page: { totalElements: 5 } }));
      component.ngOnInit();
      expect(component.serviziItems).toEqual([{ id: 's1' }]);
      expect(component.serviziTotal).toBe(1);
      expect(component.adesioniItems).toEqual([{ id: 'a1' }]);
      expect(component.adesioniTotal).toBe(2);
      expect(component.clientItems).toEqual([{ id: 'c1' }]);
      expect(component.clientTotal).toBe(3);
      expect(component.comunicazioniItems).toEqual([{ id: 'n1' }]);
      expect(component.comunicazioniTotal).toBe(4);
      expect(component.utentiItems).toEqual([{ id: 'u1' }]);
      expect(component.utentiTotal).toBe(5);
    });

    it('should not load sections when roleConfig flags are false', () => {
      mockDashboardService.computeRoleConfig.mockReturnValue({
        servizi: false, adesioni: false, client: false, comunicazioni: false, utenti: false
      });
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.getServizi).not.toHaveBeenCalled();
      expect(mockDashboardService.getAdesioni).not.toHaveBeenCalled();
      expect(mockDashboardService.getClient).not.toHaveBeenCalled();
      expect(mockDashboardService.getComunicazioni).not.toHaveBeenCalled();
      expect(mockDashboardService.getUtenti).not.toHaveBeenCalled();
    });

    it('should load only enabled sections (partial roleConfig)', () => {
      mockDashboardService.computeRoleConfig.mockReturnValue({
        servizi: true, adesioni: false, client: false, comunicazioni: true, utenti: false
      });
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(mockDashboardService.getServizi).toHaveBeenCalled();
      expect(mockDashboardService.getAdesioni).not.toHaveBeenCalled();
      expect(mockDashboardService.getClient).not.toHaveBeenCalled();
      expect(mockDashboardService.getComunicazioni).toHaveBeenCalled();
      expect(mockDashboardService.getUtenti).not.toHaveBeenCalled();
    });

    it('should handle API error on getServizi gracefully', () => {
      mockDashboardService.getServizi.mockReturnValue(throwError(() => new Error('API error')));
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component.loadingServizi).toBe(false);
      expect(component.serviziItems).toEqual([]);
    });

    it('should handle API error on getAdesioni gracefully', () => {
      mockDashboardService.getAdesioni.mockReturnValue(throwError(() => new Error('API error')));
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component.loadingAdesioni).toBe(false);
    });

    it('should handle response with null content', () => {
      mockDashboardService.getServizi.mockReturnValue(of({ content: null, page: null }));
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component.serviziItems).toEqual([]);
      expect(component.serviziTotal).toBe(0);
    });
  });

  // ========== _loadExpandedData ==========

  describe('_loadExpandedData', () => {
    it('should load expanded data for servizi section', () => {
      const response = {
        content: [{ id_servizio: 's1', nome: 'Test' }],
        page: { totalElements: 1 },
        _links: { next: { href: '/api/servizi?page=2' } }
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadExpandedData('servizi');
      expect(mockApiService.getList).toHaveBeenCalledWith('servizi', expect.objectContaining({
        params: expect.any(HttpParams)
      }), '');
      expect(component.expandedItems).toEqual([{ id_servizio: 's1', nome: 'Test' }]);
      expect(component.expandedTotal).toBe(1);
      expect(component._expandedLinks).toEqual({ next: { href: '/api/servizi?page=2' } });
      expect(component.expandedLoading).toBe(false);
    });

    it('should load expanded data for comunicazioni section using notifiche model', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
      component._loadExpandedData('comunicazioni');
      expect(mockApiService.getList).toHaveBeenCalledWith('notifiche', expect.anything(), '');
    });

    it('should pass query params when provided', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
      const query = { q: 'test', stato: 'pubblicato' };
      component._loadExpandedData('servizi', query);
      expect(mockUtils._queryToHttpParams).toHaveBeenCalledWith(query);
    });

    it('should use default HttpParams when no query provided', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
      component._loadExpandedData('servizi');
      expect(mockUtils._queryToHttpParams).not.toHaveBeenCalled();
    });

    it('should append items when url is provided (pagination)', () => {
      component.expandedItems = [{ id: 'existing1' }];
      const response = {
        content: [{ id: 'new1' }],
        page: { totalElements: 2 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadExpandedData('servizi', null, '/api/servizi?page=2');
      expect(component.expandedItems).toEqual([{ id: 'existing1' }, { id: 'new1' }]);
    });

    it('should replace items when no url (first load)', () => {
      component.expandedItems = [{ id: 'old' }];
      const response = {
        content: [{ id: 'fresh' }],
        page: { totalElements: 1 },
        _links: {}
      };
      mockApiService.getList.mockReturnValue(of(response));
      component._loadExpandedData('servizi');
      expect(component.expandedItems).toEqual([{ id: 'fresh' }]);
    });

    it('should handle error on expanded data load', () => {
      mockApiService.getList.mockReturnValue(throwError(() => new Error('Server error')));
      component._loadExpandedData('servizi');
      expect(component.expandedLoading).toBe(false);
      expect(component._expandedPreventMultiCall).toBe(false);
    });

    it('should do nothing for unknown section model', () => {
      mockApiService.getList.mockReturnValue(of({ content: [], page: { totalElements: 0 }, _links: {} }));
      component._loadExpandedData('unknown_section');
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });
  });

  // ========== __loadMoreExpandedData ==========

  describe('__loadMoreExpandedData', () => {
    it('should load more data when _links.next exists', () => {
      component.expandedSection = 'servizi';
      component._expandedLinks = { next: { href: '/api/servizi?page=2' } };
      component._expandedPreventMultiCall = false;
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.__loadMoreExpandedData();
      expect(spy).toHaveBeenCalledWith('servizi', null, '/api/servizi?page=2');
      expect(component._expandedPreventMultiCall).toBe(true);
    });

    it('should not load more data when no _links.next', () => {
      component.expandedSection = 'servizi';
      component._expandedLinks = {};
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.__loadMoreExpandedData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not load more data when _expandedPreventMultiCall is true', () => {
      component.expandedSection = 'servizi';
      component._expandedLinks = { next: { href: '/api/servizi?page=2' } };
      component._expandedPreventMultiCall = true;
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.__loadMoreExpandedData();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should not load more data when no expandedSection', () => {
      component.expandedSection = null;
      component._expandedLinks = { next: { href: '/api/servizi?page=2' } };
      component._expandedPreventMultiCall = false;
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.__loadMoreExpandedData();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ========== onExpandedViewItem ==========

  describe('onExpandedViewItem', () => {
    it('should navigate for servizio in expanded view', () => {
      component.expandedSection = 'servizi';
      component.onExpandedViewItem({ id_servizio: 's1' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi', 's1'], { queryParams: { from: 'dashboard' } });
    });

    it('should navigate for adesione in expanded view', () => {
      component.expandedSection = 'adesioni';
      component.onExpandedViewItem({ id_adesione: 'a1' });
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/adesioni', 'a1'], { queryParams: { from: 'dashboard' } });
    });

    it('should navigate for comunicazione in expanded view', () => {
      component.expandedSection = 'comunicazioni';
      component.onExpandedViewItem({
        id_notifica: 'n1',
        entita: { id_entita: 'e1', servizio: { id_servizio: 's1' } },
        tipo: { tipo: 'comunicazione' }
      });
      expect(mockRouter.navigateByUrl).toHaveBeenCalledWith(expect.stringContaining('/servizi/s1/comunicazioni'));
    });

    it('should do nothing when expandedSection is null', () => {
      component.expandedSection = null;
      component.onExpandedViewItem({ id_servizio: 's1' });
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  // ========== _updateComunicazioniStatusConfig ==========

  describe('_updateComunicazioniStatusConfig', () => {
    it('should merge servizi and adesioni status configs into comunicazioni', () => {
      const serviziStatus = { pubblicato: { label: 'Pubblicato' } };
      const adesioniStatus = { approvato: { label: 'Approvato' } };
      mockConfigService.getConfig.mockImplementation((key: string) => {
        if (key === 'servizi') return of({ options: { status: { values: serviziStatus } } });
        if (key === 'adesioni') return of({ options: { status: { values: adesioniStatus } } });
        return of({});
      });
      component.ngOnInit();
      expect(component.comunicazioniStatusConfig).toEqual({
        pubblicato: { label: 'Pubblicato' },
        approvato: { label: 'Approvato' }
      });
    });

    it('should handle empty status configs for comunicazioni merge', () => {
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.ngOnInit();
      expect(component.comunicazioniStatusConfig).toEqual({});
    });
  });

  // ========== onExpandedSearch ==========

  describe('onExpandedSearch', () => {
    it('should not call _loadExpandedData when expandedSection is null', () => {
      component.expandedSection = null;
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.onExpandedSearch({ q: 'test' });
      expect(component.expandedFilterData).toEqual({ q: 'test' });
      expect(spy).not.toHaveBeenCalled();
    });

    it('should call _loadExpandedData with filter values when expandedSection is set', () => {
      component.expandedSection = 'adesioni';
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      component.onExpandedSearch({ stato: 'approvato' });
      expect(spy).toHaveBeenCalledWith('adesioni', { stato: 'approvato' });
    });
  });

  // ========== onRefresh ==========

  describe('onRefresh', () => {
    it('should reload expanded data with current filter when expandedSection is active', () => {
      component.expandedSection = 'servizi';
      component.expandedFilterData = { q: 'test' };
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.onRefresh();
      expect(component.isRefreshing).toBe(true);
      expect(spy).toHaveBeenCalledWith('servizi', { q: 'test' });
    });

    it('should not reload expanded data when no expandedSection', () => {
      component.expandedSection = null;
      const spy = vi.spyOn(component, '_loadExpandedData').mockImplementation(() => {});
      mockConfigService.getConfig.mockReturnValue(of({}));
      component.onRefresh();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ========== getExpandedStatusConfig ==========

  describe('getExpandedStatusConfig all sections', () => {
    it('should return adesioniStatusConfig for adesioni section', () => {
      component.adesioniStatusConfig = { approvato: { label: 'A' } };
      component.expandedSection = 'adesioni';
      expect(component.getExpandedStatusConfig()).toBe(component.adesioniStatusConfig);
    });

    it('should return clientStatusConfig for client section', () => {
      component.clientStatusConfig = { attivo: { label: 'C' } };
      component.expandedSection = 'client';
      expect(component.getExpandedStatusConfig()).toBe(component.clientStatusConfig);
    });

    it('should return comunicazioniStatusConfig for comunicazioni section', () => {
      component.comunicazioniStatusConfig = { letto: { label: 'L' } };
      component.expandedSection = 'comunicazioni';
      expect(component.getExpandedStatusConfig()).toBe(component.comunicazioniStatusConfig);
    });

    it('should return utentiStatusConfig for utenti section', () => {
      component.utentiStatusConfig = { attivo: { label: 'U' } };
      component.expandedSection = 'utenti';
      expect(component.getExpandedStatusConfig()).toBe(component.utentiStatusConfig);
    });
  });

  // ========== Edge cases ==========

  describe('edge cases', () => {
    it('should handle onViewItem with missing id for servizio (no navigation)', () => {
      component.onViewItem({}, 'servizi');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle onViewItem with missing id for adesione (no navigation)', () => {
      component.onViewItem({}, 'adesioni');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle onViewItem with missing id for client (no navigation)', () => {
      component.onViewItem({}, 'client');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle onViewItem with missing id for utente (no navigation)', () => {
      component.onViewItem({}, 'utenti');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle onViewItem for unknown panelType (no navigation)', () => {
      component.onViewItem({ id: 'x' }, 'unknown');
      expect(mockRouter.navigate).not.toHaveBeenCalled();
      expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    });

    it('should switch expanded section when clicking a different section', () => {
      component.expandedSection = 'servizi';
      mockApiService.getList.mockReturnValue(of({ content: [{ id: 'a1' }], page: { totalElements: 1 }, _links: {} }));
      component.onSummaryClick('adesioni');
      expect(component.expandedSection).toBe('adesioni');
      expect(component.expandedFilterData).toBeNull();
    });
  });
});
