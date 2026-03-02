import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ItemRowMobileComponent } from './item-row-mobile.component';

describe('ItemRowMobileComponent', () => {
  let component: ItemRowMobileComponent;
  const mockElementRef = { nativeElement: {} } as any;
  const mockSanitizer = { bypassSecurityTrustHtml: (html: string) => html } as any;
  const mockTranslate = { instant: vi.fn((k: string) => k) } as any;
  const mockUtilsLib = {
    getObjectValue: vi.fn().mockReturnValue(''),
    msToTime: vi.fn().mockReturnValue('00:00'),
  } as any;
  const mockConfigService = {
    getAppConfig: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ItemRowMobileComponent(mockElementRef, mockSanitizer, mockTranslate, mockUtilsLib, mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default actionDisabled false', () => {
    expect(component.actionDisabled).toBe(false);
  });

  it('should have default hoverFeedback true', () => {
    expect(component.hoverFeedback).toBe(true);
  });

  it('should emit itemClick on __itemClick', () => {
    const spy = vi.fn();
    component.itemClick.subscribe(spy);
    component._data = { id: 1 };
    const event = new MouseEvent('click');
    component.__itemClick(event);
    expect(spy).toHaveBeenCalledWith({ data: { id: 1 }, event });
  });

  it('should emit actionClick on __actionlick', () => {
    const spy = vi.fn();
    component.actionClick.subscribe(spy);
    component._data = { id: 2 };
    const event = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() };
    component.__actionlick(event);
    expect(spy).toHaveBeenCalledWith({ id: 2 });
  });

  it('should emit openInNewTab on __openInNewTab', () => {
    const spy = vi.fn();
    component.openInNewTab.subscribe(spy);
    component._data = { id: 3 };
    const event = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() } as any;
    component.__openInNewTab(event);
    expect(spy).toHaveBeenCalledWith({ data: { id: 3 }, event });
  });

  it('should hide empty field when hideEmpty is true', () => {
    component._data = { source: { field1: '' } };
    mockUtilsLib.getObjectValue.mockReturnValue('');
    expect(component._showEmpty({ field: 'field1', hideEmpty: true })).toBe(false);
  });

  it('should show field when hideEmpty is false', () => {
    component._data = { source: { field1: '' } };
    mockUtilsLib.getObjectValue.mockReturnValue('');
    expect(component._showEmpty({ field: 'field1', hideEmpty: false })).toBe(true);
  });

  it('should check configDependency returns true when no dependency', () => {
    expect(component._checkConfigDependency({ field: 'test' })).toBe(true);
  });
});
