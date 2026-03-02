import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CustomPropertiesComponent } from './custom-properties.component';

describe('CustomPropertiesComponent', () => {
  let component: CustomPropertiesComponent;
  const mockFormBuilder = { group: vi.fn().mockReturnValue({}) } as any;
  const mockEventsManager = {} as any;
  const mockAuthService = {} as any;
  const mockApiService = {} as any;
  const mockUtils = {} as any;

  beforeEach(() => {
    component = new CustomPropertiesComponent(
      mockFormBuilder, mockEventsManager, mockAuthService, mockApiService, mockUtils
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have null ambiente by default', () => {
    expect(component.ambiente).toBeNull();
  });

  it('should have editable true by default', () => {
    expect(component.editable).toBe(true);
  });

  it('should have showGroupLabel true by default', () => {
    expect(component.showGroupLabel).toBe(true);
  });

  it('should have onSave output', () => {
    expect(component.onSave).toBeDefined();
  });

  it('should not be in edit mode by default', () => {
    expect(component._isEdit).toBe(false);
  });

  it('should accept data input', () => {
    component.data = [{ gruppi: [] }];
    expect(component.data).toEqual([{ gruppi: [] }]);
  });

  it('should emit onSave', () => {
    const spy = vi.fn();
    component.onSave.subscribe(spy);
    component.onSave.emit({ test: true });
    expect(spy).toHaveBeenCalledWith({ test: true });
  });
});
