import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { TreeViewCategoryComponent } from './tree-view-category.component';

describe('TreeViewCategoryComponent', () => {
  let component: TreeViewCategoryComponent;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://test-api' } } }),
  } as any;

  beforeEach(() => {
    component = new TreeViewCategoryComponent(mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://test-api');
  });

  it('should have default enabled true', () => {
    expect(component.enabled).toBe(true);
  });

  it('should have default countChildren 0', () => {
    expect(component.countChildren).toBe(0);
  });

  it('should emit action event', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    const event = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() };
    component.onAction(event, 'select', { id: 1 });
    expect(spy).toHaveBeenCalled();
  });

  it('should check notSelectable items', () => {
    component.notSelectable = [{ id_gruppo: 3 }];
    expect(component.isNotSelectable({ id_gruppo: 3 })).toBe(true);
    expect(component.isNotSelectable({ id_gruppo: 7 })).toBe(false);
  });
});
