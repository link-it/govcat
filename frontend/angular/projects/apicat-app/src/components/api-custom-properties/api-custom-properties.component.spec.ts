import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiCustomPropertiesComponent } from './api-custom-properties.component';

describe('ApiCustomPropertiesComponent', () => {
  let component: ApiCustomPropertiesComponent;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({}),
    getAppConfig: vi.fn().mockReturnValue({}),
    getConfig: vi.fn(),
  } as any;
  const mockApiService = { getList: vi.fn() } as any;
  const mockUtils = {} as any;
  const mockCheckProvider = {} as any;

  beforeEach(() => {
    component = new ApiCustomPropertiesComponent(
      mockConfigService, mockApiService, mockUtils, mockCheckProvider
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have editable true by default', () => {
    expect(component.editable).toBe(true);
  });

  it('should have showGroupLabel true by default', () => {
    expect(component.showGroupLabel).toBe(true);
  });

  it('should have default message', () => {
    expect(component._message).toBe('APP.MESSAGE.SelectApi');
  });

  it('should have onSave output', () => {
    expect(component.onSave).toBeDefined();
  });

  it('should emit onSave', () => {
    const spy = vi.fn();
    component.onSave.subscribe(spy);
    component.onSave.emit({ data: 'test' });
    expect(spy).toHaveBeenCalledWith({ data: 'test' });
  });
});
