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

  // ─── ngOnInit ───

  it('should set _itemRowConfig from config on ngOnInit', () => {
    component._config = { itemRow: { label: 'test' } };
    component.configRow = 'itemRow';
    component.ngOnInit();
    expect(component._itemRowConfig).toEqual({ label: 'test' });
  });

  it('should fallback to config.itemRow if configRow key not found', () => {
    component._config = { itemRow: { label: 'fallback' } };
    component.configRow = 'nonExistent';
    component.ngOnInit();
    expect(component._itemRowConfig).toEqual({ label: 'fallback' });
  });

  it('should fallback to config.simpleItem if neither key exists', () => {
    component._config = { simpleItem: { label: 'simple' } };
    component.configRow = 'nonExistent';
    component.ngOnInit();
    expect(component._itemRowConfig).toEqual({ label: 'simple' });
  });

  it('should set _itemRowConfig to null when no config', () => {
    component._config = null;
    component.ngOnInit();
    expect(component._itemRowConfig).toBeNull();
  });

  it('should set tooltip for boxStatus1 on ngOnInit', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = {
      itemRow: { boxStatus1: { tooltip: 'Stato servizio' } },
      options: {}
    };
    component.ngOnInit();
    expect(component._tooltipBox1).toBe('Stato servizio');
  });

  it('should set tooltip for boxStatus2 on ngOnInit', () => {
    component._data = { source: { tipo: 'rest' } };
    component._config = {
      itemRow: { boxStatus2: { tooltip: 'Tipo servizio' } },
      options: {}
    };
    component.ngOnInit();
    expect(component._tooltipBox2).toBe('Tipo servizio');
  });

  // ─── _sanitizeHtml ───

  it('should sanitize html', () => {
    const result = component._sanitizeHtml('<b>test</b>');
    expect(result).toBe('<b>test</b>');
  });

  // ─── _hideAnonymous ───

  it('should return false when not anonymous', () => {
    component.isAnonymous = false;
    expect(component._hideAnonymous({ hideAnonymous: true })).toBe(false);
  });

  it('should return true when anonymous and field has hideAnonymous', () => {
    component.isAnonymous = true;
    expect(component._hideAnonymous({ hideAnonymous: true })).toBe(true);
  });

  it('should return false when anonymous but field has no hideAnonymous', () => {
    component.isAnonymous = true;
    expect(component._hideAnonymous({})).toBe(false);
  });

  // ─── _checkConfigDependency ───

  it('should return false when configDependency resolves to truthy value', () => {
    mockConfigService.getAppConfig.mockReturnValue({ Services: { hideVersions: true } });
    expect(component._checkConfigDependency({ configDependency: 'Services.hideVersions' })).toBe(false);
  });

  it('should return true when configDependency resolves to falsy value', () => {
    mockConfigService.getAppConfig.mockReturnValue({ Services: { hideVersions: false } });
    expect(component._checkConfigDependency({ configDependency: 'Services.hideVersions' })).toBe(true);
  });

  it('should return true when configDependency path does not exist', () => {
    mockConfigService.getAppConfig.mockReturnValue({ Services: {} });
    expect(component._checkConfigDependency({ configDependency: 'Services.nonExistent.deep' })).toBe(true);
  });

  it('should return true when appConfig is null', () => {
    mockConfigService.getAppConfig.mockReturnValue(null);
    expect(component._checkConfigDependency({ configDependency: 'Services.hideVersions' })).toBe(true);
  });

  // ─── _getBackground ───

  it('should return static background string', () => {
    const result = component._getBackground({ background: '#ff0000' });
    expect(result).toBe('#ff0000');
  });

  it('should return dynamic background from config options', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = {
      options: { status: { values: { attivo: { background: '#00ff00' } } } }
    };
    mockUtilsLib.getObjectValue.mockReturnValue('attivo');
    const result = component._getBackground({
      background: { field: 'stato', options: 'status' }
    });
    expect(result).toBe('#00ff00');
  });

  it('should return default background #1f1f1f when value not in options', () => {
    component._data = { source: { stato: 'unknown' } };
    component._config = { options: { status: { values: {} } } };
    mockUtilsLib.getObjectValue.mockReturnValue('unknown');
    const result = component._getBackground({
      background: { field: 'stato', options: 'status' }
    });
    expect(result).toBe('#1f1f1f');
  });

  // ─── _getColor ───

  it('should return static color from boxOptions', () => {
    const result = component._getColor({ background: '#000', color: '#fff' });
    expect(result).toBe('#fff');
  });

  it('should return dynamic color from config options', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = {
      options: { status: { values: { attivo: { color: '#333' } } } }
    };
    mockUtilsLib.getObjectValue.mockReturnValue('attivo');
    const result = component._getColor({
      background: { field: 'stato', options: 'status' }
    });
    expect(result).toBe('#333');
  });

  it('should return default color #fff when value not in options', () => {
    component._data = { source: {} };
    component._config = { options: { status: { values: {} } } };
    mockUtilsLib.getObjectValue.mockReturnValue('missing');
    const result = component._getColor({
      background: { field: 'stato', options: 'status' }
    });
    expect(result).toBe('#fff');
  });

  // ─── _setTooltip ───

  it('should return translated string tooltip', () => {
    const result = component._setTooltip({ tooltip: 'MY_TOOLTIP' });
    expect(result).toBe('MY_TOOLTIP');
    expect(mockTranslate.instant).toHaveBeenCalledWith('MY_TOOLTIP');
  });

  it('should return composed tooltip from object config', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = { options: { status: { values: {} } } };
    mockUtilsLib.getObjectValue.mockReturnValue('attivo');
    const result = component._setTooltip({
      tooltip: { field: 'stato', options: 'status', label: 'LABEL' }
    });
    expect(result).toContain('LABEL');
    expect(result).toContain('attivo');
  });

  it('should use option tooltip when available', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = {
      options: { status: { values: { attivo: { icon: 'check', tooltip: 'Attivo' } } } }
    };
    mockUtilsLib.getObjectValue.mockReturnValue('attivo');
    const result = component._setTooltip({
      tooltip: { field: 'stato', options: 'status', label: 'LABEL' }
    });
    expect(result).toContain('Attivo');
  });

  it('should use tooltip2 as value when available', () => {
    component._data = { source: { stato: 'attivo' } };
    component._config = {
      options: { status: { values: { attivo: { icon: 'check', tooltip: 'Label', tooltip2: 'Value2' } } } }
    };
    mockUtilsLib.getObjectValue.mockReturnValue('attivo');
    const result = component._setTooltip({
      tooltip: { field: 'stato', options: 'status', label: 'LABEL' }
    });
    expect(result).toContain('Value2');
  });

  it('should use msToTime for mstime type tooltip', () => {
    component._data = { source: { tempo: 12345 } };
    component._config = { options: { status: { values: {} } } };
    mockUtilsLib.getObjectValue.mockReturnValue(12345);
    mockUtilsLib.msToTime.mockReturnValue('00:12');
    component._setTooltip({
      tooltip: { field: 'tempo', options: 'status', label: 'LABEL', type: 'mstime' }
    });
    expect(mockUtilsLib.msToTime).toHaveBeenCalled();
  });

  // ─── _setTooltipPlacement ───

  it('should return placement from object tooltip config', () => {
    const result = component._setTooltipPlacement({
      tooltip: { placement: 'bottom' }
    });
    expect(result).toBe('bottom');
  });

  it('should default to top when object tooltip has no placement', () => {
    const result = component._setTooltipPlacement({
      tooltip: { field: 'test' }
    });
    expect(result).toBe('top');
  });

  it('should default to top when tooltip is a string', () => {
    const result = component._setTooltipPlacement({ tooltip: 'simple' });
    expect(result).toBe('top');
  });

  // ─── notifyClass HostBinding ───

  it('should return notify value for notifyClass', () => {
    component.notify = true;
    expect(component.notifyClass).toBe(true);
    component.notify = false;
    expect(component.notifyClass).toBe(false);
  });

  // ─── _showEmpty edge cases ───

  it('should show field when value is truthy even with hideEmpty', () => {
    component._data = { source: { field1: 'value' } };
    mockUtilsLib.getObjectValue.mockReturnValue('value');
    expect(component._showEmpty({ field: 'field1', hideEmpty: true })).toBe(true);
  });
});
