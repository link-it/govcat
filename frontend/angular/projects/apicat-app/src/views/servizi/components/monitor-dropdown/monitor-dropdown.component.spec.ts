import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { MonitorDropdwnComponent } from './monitor-dropdown.component';

describe('MonitorDropdwnComponent', () => {
  let component: MonitorDropdwnComponent;

  const mockRouter = {
    navigate: vi.fn()
  } as any;

  const mockAuthenticationService = {
    _getConfigModule: vi.fn().mockReturnValue({
      abilitato: true,
      transazioni_abilitate: true,
      statistiche_abilitate: true,
      verifiche_abilitate: true,
      ruoli_abilitati: []
    }),
    hasRole: vi.fn().mockReturnValue(false)
  } as any;

  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({
      AppConfig: {
        Layout: { showCommunicationsMenu: true }
      }
    })
  } as any;

  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] }))
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        Layout: { showCommunicationsMenu: true }
      }
    });
    mockAuthenticationService._getConfigModule.mockReturnValue({
      abilitato: true,
      transazioni_abilitate: true,
      statistiche_abilitate: true,
      verifiche_abilitate: true,
      ruoli_abilitati: []
    });
    mockAuthenticationService.hasRole.mockReturnValue(false);
    component = new MonitorDropdwnComponent(
      mockRouter,
      mockAuthenticationService,
      mockConfigService,
      mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.service_id).toBeNull();
    expect(component.showComunications).toBe(true);
    expect(component.showMonitoring).toBe(true);
    expect(component.showManagement).toBe(true);
    expect(component.returnWeb).toBe(false);
    expect(component.returnWebTitle).toBe('APP.MENU.BackView');
    expect(component.otherActions).toEqual([]);
  });

  it('should set appConfig from configService in constructor', () => {
    expect(component.appConfig).toEqual({
      AppConfig: {
        Layout: { showCommunicationsMenu: true }
      }
    });
  });

  it('should set _showCommunicationsMenuConfig to true when config is true', () => {
    expect(component._showCommunicationsMenuConfig).toBe(true);
  });

  it('should set _showCommunicationsMenuConfig to false when config is false', () => {
    mockConfigService.getConfiguration.mockReturnValue({
      AppConfig: {
        Layout: { showCommunicationsMenu: false }
      }
    });
    const comp = new MonitorDropdwnComponent(mockRouter, mockAuthenticationService, mockConfigService, mockApiService);
    expect(comp._showCommunicationsMenuConfig).toBe(false);
  });

  it('should have default visibility flags', () => {
    expect(component._showMonitoraggio).toBe(true);
    expect(component._showTransazioni).toBe(true);
    expect(component._showStatistiche).toBe(true);
    expect(component._showVerifiche).toBe(true);
  });

  it('should emit action on onAction', () => {
    const emitSpy = vi.spyOn(component.action, 'emit');
    component.onAction({ action: 'comunicazioni' });
    expect(emitSpy).toHaveBeenCalledWith({ action: 'comunicazioni' });
  });

  it('should initialize monitoring flags in ngOnInit', () => {
    component.ngOnInit();
    expect(mockAuthenticationService._getConfigModule).toHaveBeenCalledWith('monitoraggio');
    expect(component._showTransazioni).toBe(true);
    expect(component._showStatistiche).toBe(true);
    expect(component._showVerifiche).toBe(true);
  });

  it('should build menu actions on initMenu', () => {
    component.ngOnInit();
    expect(component._menuActions.length).toBeGreaterThan(0);
  });

  describe('voci di monitoraggio (Issue #418)', () => {
    const voci = () => component._menuActions.filter((m: any) => ['transazioni', 'statistiche', 'verifiche'].includes(m.action) && m.enabled).map((m: any) => m.action);

    it('should follow showMonitoring (grant of the service) and not the general role', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({
        abilitato: true, ruoli_abilitati: ['referente'],
        transazioni_abilitate: true, statistiche_abilitate: true, verifiche_abilitate: false
      });
      mockAuthenticationService.hasRole.mockReturnValue(false);
      component.showMonitoring = true;
      component.ngOnInit();
      expect(voci()).toEqual(['transazioni', 'statistiche']);
      component.showMonitoring = false;
      component.initMenu();
      expect(voci()).toEqual([]);
    });

    it('should not fail when ruoli_abilitati is missing', () => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ abilitato: true, transazioni_abilitate: true });
      expect(() => component.ngOnInit()).not.toThrow();
    });
  });

  describe('voce Audit (Issue #404)', () => {
    const audit = () => component._menuActions.find((m: any) => m.action === 'audit')?.enabled;
    const label = () => component._menuActions.find((m: any) => m.title === 'APP.MENU.Monitoring')?.enabled;
    const proprieta_audit = [{ nome_gruppo: 'PDNDProduzione', nome_proprieta: 'audit', ambiente: 'produzione' }];
    const apiAudit = { id_api: 'a1', proprieta_custom: [{ gruppo: 'PDNDProduzione', proprieta: [{ nome: 'audit', valore: 'AUDIT_REST_02' }] }] };

    beforeEach(() => {
      mockAuthenticationService._getConfigModule.mockReturnValue({ abilitato: true, audit_abilitato: true, proprieta_audit });
      component.service_id = 's1';
      component._menuAuditAttivo = true;
    });

    it('should keep the item hidden while the audit menu is not active', () => {
      component._menuAuditAttivo = false;
      mockApiService.getList.mockReturnValue(of({ content: [apiAudit] }));
      mockAuthenticationService._getConfigModule.mockReturnValue({ abilitato: true, audit_abilitato: true, proprieta_audit });
      component.ngOnInit();
      expect(audit()).toBe(false);
      expect(label()).toBeFalsy();
      expect(mockApiService.getList).not.toHaveBeenCalled();
    });

    it('should show the item when the service has an API with audit', () => {
      mockApiService.getList.mockReturnValue(of({ content: [{ id_api: 'a0' }, apiAudit] }));
      component.ngOnInit();
      expect(mockApiService.getList).toHaveBeenCalledWith('api', { params: { id_servizio: 's1', size: '100' } });
      expect(audit()).toBe(true);
      expect(label()).toBe(true);
      component.ngOnChanges({});
      expect(mockApiService.getList).toHaveBeenCalledTimes(1);
    });

    it('should hide the item without APIs with audit, with audit disabled or without showMonitoring', () => {
      component.ngOnInit();
      expect(audit()).toBe(false);
      mockAuthenticationService._getConfigModule.mockReturnValue({ abilitato: true, audit_abilitato: false, proprieta_audit });
      mockApiService.getList.mockReturnValue(of({ content: [apiAudit] }));
      component.ngOnInit();
      expect(audit()).toBe(false);
      expect(label()).toBeFalsy();
      mockAuthenticationService._getConfigModule.mockReturnValue({ abilitato: true, audit_abilitato: true, proprieta_audit });
      component.service_id = 's2';
      component.showMonitoring = false;
      component.ngOnInit();
      expect(audit()).toBe(false);
      expect(mockApiService.getList).toHaveBeenCalledTimes(1);
    });
  });
});
