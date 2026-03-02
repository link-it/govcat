import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { MonitoraggioGroupComponent } from './monitoraggio-group.component';

describe('MonitoraggioGroupComponent', () => {
  let component: MonitoraggioGroupComponent;
  const mockEventsManager = {
    on: vi.fn(),
  } as any;
  const mockAuthService = {} as any;
  const mockApiService = {
    getMonitor: vi.fn().mockReturnValue(of({ periodo1: 5, periodo2: 10 })),
  } as any;
  const mockUtilService = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockEventsManager.on.mockImplementation(() => {});
    mockApiService.getMonitor.mockReturnValue(of({ periodo1: 5, periodo2: 10 }));
    component = new MonitoraggioGroupComponent(
      mockEventsManager, mockAuthService, mockApiService, mockUtilService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.type).toBe('');
    expect(component.sections).toEqual([]);
    expect(component.reduced).toBe(false);
    expect(component._spin).toBe(false);
  });

  it('should register on REFRESH_DATA event', () => {
    expect(mockEventsManager.on).toHaveBeenCalled();
  });

  it('should emit action with block and section', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    const block = { name: 'test' };
    const section = { title: 'Section' };
    component.onAction(block, section);
    expect(spy).toHaveBeenCalledWith({ block, section });
  });

  it('should load data from API for each section', () => {
    component.environmentId = 'collaudo' as any;
    component.sections = [
      { path: '/cert', range: false, blocks: [{ name: 'periodo1', count: 0 }, { name: 'periodo2', count: 0 }] }
    ];
    component.loadData();
    expect(mockApiService.getMonitor).toHaveBeenCalledWith('collaudo/cert', undefined);
  });

  it('should pass period params when section has range', () => {
    component.environmentId = 'collaudo' as any;
    component.period1 = { p1_start: '2026-01-01' };
    component.period2 = { p2_start: '2026-01-01' };
    component.sections = [
      { path: '/events', range: true, blocks: [{ name: 'periodo1', count: 0 }] }
    ];
    component.loadData();
    expect(mockUtilService._queryToHttpParams).toHaveBeenCalled();
    expect(mockApiService.getMonitor).toHaveBeenCalled();
  });

  it('should set block counts on API success', () => {
    mockApiService.getMonitor.mockReturnValue(of({ periodo1: 42, periodo2: 7 }));
    component.sections = [
      { path: '/cert', range: false, blocks: [{ name: 'periodo1', count: 0 }, { name: 'periodo2', count: 0 }] }
    ];
    component.loadData();
    expect(component.sections[0].blocks[0].count).toBe(42);
    expect(component.sections[0].blocks[1].count).toBe(7);
  });

  it('should set block counts to -1 on API error', () => {
    mockApiService.getMonitor.mockReturnValue(throwError(() => new Error('fail')));
    component.sections = [
      { path: '/cert', range: false, blocks: [{ name: 'periodo1', count: 0 }] }
    ];
    component.loadData();
    expect(component.sections[0].blocks[0].count).toBe(-1);
    expect(component._spin).toBe(false);
  });

  it('should loadData on ngOnChanges when environmentId changes', () => {
    const spy = vi.spyOn(component, 'loadData');
    component.sections = [];
    component.ngOnChanges({
      environmentId: { currentValue: 'produzione', previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.environmentId).toBe('produzione');
    expect(spy).toHaveBeenCalled();
  });
});
