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

  it('should loadData on ngOnChanges when sections change', () => {
    const spy = vi.spyOn(component, 'loadData');
    const newSections = [{ path: '/new', range: false, blocks: [] }];
    component.ngOnChanges({
      sections: { currentValue: newSections, previousValue: [], firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.sections).toBe(newSections);
    expect(spy).toHaveBeenCalled();
  });

  it('should loadData on ngOnChanges when period1 changes', () => {
    const spy = vi.spyOn(component, 'loadData');
    component.sections = [];
    component.ngOnChanges({
      period1: { currentValue: { start: '2026-01-01' }, previousValue: {}, firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.period1).toEqual({ start: '2026-01-01' });
    expect(spy).toHaveBeenCalled();
  });

  it('should loadData on ngOnChanges when period2 changes', () => {
    const spy = vi.spyOn(component, 'loadData');
    component.sections = [];
    component.ngOnChanges({
      period2: { currentValue: { end: '2026-12-31' }, previousValue: {}, firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.period2).toEqual({ end: '2026-12-31' });
    expect(spy).toHaveBeenCalled();
  });

  it('should NOT loadData on ngOnChanges when no relevant changes', () => {
    const spy = vi.spyOn(component, 'loadData');
    component.ngOnChanges({
      reduced: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
    } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should NOT loadData on ngOnChanges when currentValue is falsy', () => {
    const spy = vi.spyOn(component, 'loadData');
    component.ngOnChanges({
      environmentId: { currentValue: null, previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
    } as any);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle multiple sections in loadData', () => {
    mockApiService.getMonitor
      .mockReturnValueOnce(of({ count1: 10 }))
      .mockReturnValueOnce(of({ count2: 20 }));
    component.environmentId = 'collaudo' as any;
    component.sections = [
      { path: '/cert', range: false, blocks: [{ name: 'count1', count: 0 }] },
      { path: '/events', range: false, blocks: [{ name: 'count2', count: 0 }] }
    ];
    component.loadData();
    expect(mockApiService.getMonitor).toHaveBeenCalledTimes(2);
    expect(component.sections[0].blocks[0].count).toBe(10);
    expect(component.sections[1].blocks[0].count).toBe(20);
  });

  it('should handle empty sections array in loadData', () => {
    component.sections = [];
    component.loadData();
    expect(mockApiService.getMonitor).not.toHaveBeenCalled();
    expect(component._spin).toBe(true);
  });

  it('should set _spin to true at start of loadData', () => {
    component.sections = [
      { path: '/cert', range: false, blocks: [{ name: 'a', count: 0 }] }
    ];
    let spinDuringCall = false;
    mockApiService.getMonitor.mockImplementation(() => {
      spinDuringCall = component._spin;
      return of({ a: 1 });
    });
    component.loadData();
    expect(spinDuringCall).toBe(true);
  });

  it('should merge period1 and period2 for range sections', () => {
    component.period1 = { data_inizio_1: '2026-01-01' };
    component.period2 = { data_inizio_2: '2026-06-01' };
    component.sections = [
      { path: '/events', range: true, blocks: [{ name: 'periodo1', count: 0 }] }
    ];
    component.loadData();
    expect(mockUtilService._queryToHttpParams).toHaveBeenCalledWith({
      data_inizio_1: '2026-01-01',
      data_inizio_2: '2026-06-01'
    });
  });

  it('should register REFRESH_DATA callback that calls loadData', () => {
    let capturedCallback: any;
    mockEventsManager.on.mockImplementation((_type: any, cb: any) => { capturedCallback = cb; });
    const comp = new MonitoraggioGroupComponent(
      mockEventsManager, mockAuthService, mockApiService, mockUtilService
    );
    const spy = vi.spyOn(comp, 'loadData');
    comp.sections = [];
    capturedCallback({});
    expect(spy).toHaveBeenCalled();
  });
});
