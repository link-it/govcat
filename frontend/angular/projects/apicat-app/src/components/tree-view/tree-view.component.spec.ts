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

  describe('freccia del ramo (Issue #421)', () => {
    it('should open and close a branch without selecting the row', () => {
      component.selectable = true;
      const emit = vi.spyOn(component.action, 'emit');
      const event = { stopPropagation: vi.fn() } as any;
      const item: any = { id_gruppo: 'g1', figli: [{ id_gruppo: 'g2' }], isOpen: true };
      component.onToggle(event, item);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(item.isOpen).toBe(false);
      expect(emit).toHaveBeenCalledWith({ action: 'close', item });
      expect(emit).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'select' }));
    });

    it('should do nothing on the caret of a leaf', () => {
      const emit = vi.spyOn(component.action, 'emit');
      const event = { stopPropagation: vi.fn() } as any;
      component.onToggle(event, { id_gruppo: 'g3' });
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(emit).not.toHaveBeenCalled();
    });
  });
});
