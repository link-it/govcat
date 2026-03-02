import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { TreeViewComponent } from './tree-view.component';

describe('TreeViewComponent', () => {
  let component: TreeViewComponent;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: { GOVAPI: { HOST: 'http://test-api' } } }),
  } as any;

  beforeEach(() => {
    component = new TreeViewComponent(mockConfigService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should set apiUrl from config', () => {
    expect(component.apiUrl).toBe('http://test-api');
  });

  it('should have default isEditable true', () => {
    expect(component.isEditable).toBe(true);
  });

  it('should have default isRemovable true', () => {
    expect(component.isRemovable).toBe(true);
  });

  it('should have default selectable false', () => {
    expect(component.selectable).toBe(false);
  });

  it('should emit action event', () => {
    const spy = vi.fn();
    component.action.subscribe(spy);
    const event = { stopImmediatePropagation: vi.fn(), preventDefault: vi.fn() };
    component.onAction(event, 'edit', { id: 1 });
    expect(spy).toHaveBeenCalled();
  });

  it('should check notSelectable items', () => {
    component.notSelectable = [{ id_gruppo: 5 }];
    expect(component.isNotSelectable({ id_gruppo: 5 })).toBe(true);
    expect(component.isNotSelectable({ id_gruppo: 99 })).toBe(false);
  });

  it('should update children on ngOnChanges', () => {
    const children = [{ id: 1 }, { id: 2 }];
    component.ngOnChanges({ children: new SimpleChange(undefined, children, true) });
    expect(component.children).toEqual(children);
  });
});
