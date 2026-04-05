import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  beforeEach(() => {
    vi.clearAllMocks();
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
      mockConfigService
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
    const comp = new MonitorDropdwnComponent(mockRouter, mockAuthenticationService, mockConfigService);
    expect(comp._showCommunicationsMenuConfig).toBe(false);
  });

  it('should have default visibility flags', () => {
    expect(component._showMonitoraggio).toBe(true);
    expect(component._showTransazioni).toBe(true);
    expect(component._showStatistiche).toBe(true);
    expect(component._showVerifiche).toBe(true);
    expect(component._hasRole).toBe(false);
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
});
