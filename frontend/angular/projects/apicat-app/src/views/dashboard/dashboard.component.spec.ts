import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
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
});
