import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MonitoraggioCardComponent } from './monitoraggio-card.component';

describe('MonitoraggioCardComponent', () => {
  let component: MonitoraggioCardComponent;
  const mockAuthService = {
    _getConfigModule: vi.fn().mockReturnValue({
      periodi: { periodo_1: 120, periodo_2: 1440 }
    }),
  } as any;
  const mockEventsManager = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService._getConfigModule.mockReturnValue({
      periodi: { periodo_1: 120, periodo_2: 1440 }
    });
    component = new MonitoraggioCardComponent(mockAuthService, mockEventsManager);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.section).toBeNull();
    expect(component.spin).toBe(true);
    expect(component.reduced).toBe(false);
    expect(component.showDebug).toBe(false);
  });

  it('should read periods from config', () => {
    expect(component._minutesPeriodo1).toBe(120);
    expect(component._minutesPeriodo2).toBe(1440);
  });

  it('should emit action', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    const block = { name: 'test' };
    component.onAction(block);
    expect(spy).toHaveBeenCalledWith(block);
  });

  it('should toggle showDebug on Ctrl+D', () => {
    expect(component.showDebug).toBe(false);
    component.keyEvent({ key: 'd', ctrlKey: true } as KeyboardEvent);
    expect(component.showDebug).toBe(true);
    component.keyEvent({ key: 'd', ctrlKey: true } as KeyboardEvent);
    expect(component.showDebug).toBe(false);
  });

  it('should not toggle showDebug without Ctrl', () => {
    component.keyEvent({ key: 'd', ctrlKey: false } as KeyboardEvent);
    expect(component.showDebug).toBe(false);
  });

  it('should return period for block', () => {
    expect(component._getBlockPeriod({ name: 'periodo1' })).toBe(120);
    expect(component._getBlockPeriod({ name: '' })).toBe(1440);
  });

  it('should return period hours for block', () => {
    expect(component._getBlockPeriodHours({ name: 'periodo1' })).toBe(2);
    expect(component._getBlockPeriodHours({ name: 'periodo2' })).toBe(24);
  });

  it('should return translate data for block', () => {
    const data1 = component._getBlockTraslateData({ name: 'periodo1' });
    expect(data1.hours).toBe('2');
    expect(data1.minutes).toBe('');

    const data2 = component._getBlockTraslateData({ name: 'periodo2' });
    expect(data2.hours).toBe('24');
    expect(data2.minutes).toBe('');
  });

  it('should return non-empty minutes when not round hours', () => {
    mockAuthService._getConfigModule.mockReturnValue({
      periodi: { periodo_1: 90, periodo_2: 1440 }
    });
    const comp = new MonitoraggioCardComponent(mockAuthService, mockEventsManager);
    const data = comp._getBlockTraslateData({ name: 'periodo1' });
    expect(data.hours).toBe('1');
    expect(data.minutes).toBe("e 30'");
  });

  it('should update environmentId on ngOnChanges', () => {
    component.ngOnChanges({
      environmentId: { currentValue: 'produzione', previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.environmentId).toBe('produzione');
  });

  it('should update section on ngOnChanges', () => {
    const newSection = { path: '/cert', blocks: [] };
    component.ngOnChanges({
      section: { currentValue: newSection, previousValue: null, firstChange: true, isFirstChange: () => true }
    } as any);
    expect(component.section).toBe(newSection);
  });

  it('should not change environmentId when currentValue is falsy', () => {
    component.environmentId = 'collaudo' as any;
    component.ngOnChanges({
      environmentId: { currentValue: null, previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
    } as any);
    expect(component.environmentId).toBe('collaudo');
  });

  it('should not toggle showDebug on other keys', () => {
    component.keyEvent({ key: 'a', ctrlKey: true } as KeyboardEvent);
    expect(component.showDebug).toBe(false);
  });

  it('should not toggle showDebug on Ctrl+D with shift', () => {
    component.keyEvent({ key: 'D', ctrlKey: true } as KeyboardEvent);
    expect(component.showDebug).toBe(false);
  });

  describe('loadData', () => {
    it('should set spin to true', () => {
      component.section = { path: '/cert' };
      component.loadData();
      expect(component.spin).toBe(true);
    });

    it('should set spin to false after timeout', () => {
      vi.useFakeTimers();
      component.section = { path: '/cert' };
      component.loadData();
      expect(component.spin).toBe(true);
      vi.advanceTimersByTime(1000);
      expect(component.spin).toBe(false);
      vi.useRealTimers();
    });
  });

  describe('_getBlockPeriod', () => {
    it('should return periodo1 minutes when block.name is truthy', () => {
      expect(component._getBlockPeriod({ name: 'anything' })).toBe(120);
    });

    it('should return periodo2 minutes when block.name is falsy', () => {
      expect(component._getBlockPeriod({ name: '' })).toBe(1440);
      expect(component._getBlockPeriod({ name: null })).toBe(1440);
    });
  });

  describe('_getBlockTraslateData with remainder minutes', () => {
    it('should format 150 minutes as 2h e 30min', () => {
      mockAuthService._getConfigModule.mockReturnValue({
        periodi: { periodo_1: 150, periodo_2: 75 }
      });
      const comp = new MonitoraggioCardComponent(mockAuthService, mockEventsManager);
      const data1 = comp._getBlockTraslateData({ name: 'periodo1' });
      expect(data1.hours).toBe('2');
      expect(data1.minutes).toBe("e 30'");

      const data2 = comp._getBlockTraslateData({ name: 'periodo2' });
      expect(data2.hours).toBe('1');
      expect(data2.minutes).toBe("e 15'");
    });
  });

  describe('_getBlockPeriodHours', () => {
    it('should return floor of hours for non-round minutes', () => {
      mockAuthService._getConfigModule.mockReturnValue({
        periodi: { periodo_1: 90, periodo_2: 45 }
      });
      const comp = new MonitoraggioCardComponent(mockAuthService, mockEventsManager);
      expect(comp._getBlockPeriodHours({ name: 'periodo1' })).toBe(1);
      expect(comp._getBlockPeriodHours({ name: 'periodo2' })).toBe(0);
    });
  });
});
