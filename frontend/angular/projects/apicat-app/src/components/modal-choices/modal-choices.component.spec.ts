import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ModalChoicesComponent } from './modal-choices.component';

describe('ModalChoicesComponent', () => {
  let component: ModalChoicesComponent;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new ModalChoicesComponent(mockModalRef, mockTranslate);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize onClose subject on ngOnInit', () => {
    component.list = ['a', 'b', 'c'];
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(component._list).toEqual(['a', 'b', 'c']);
  });

  it('should close modal', () => {
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should emit selected on onSelected', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.selected = ['item1'];
    component.onSelected();
    expect(spy).toHaveBeenCalledWith(['item1']);
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should select all items', () => {
    component.list = ['a', 'b', 'c'];
    component.onSelectAll();
    expect(component.selected).toEqual(['a', 'b', 'c']);
  });

  it('should deselect all items', () => {
    component.selected = ['a', 'b'];
    component.onDeselectAll();
    expect(component.selected).toEqual([]);
  });

  it('should toggle item selection (string)', () => {
    component.selected = [];
    component.selectItem('a');
    expect(component.selected).toContain('a');
    component.selectItem('a');
    expect(component.selected).not.toContain('a');
  });

  it('should toggle item selection (object)', () => {
    component.selected = [];
    component.selectItem({ value: 'x' });
    expect(component.selected).toContainEqual({ value: 'x' });
    component.selectItem({ value: 'x' });
    expect(component.selected).not.toContainEqual({ value: 'x' });
  });

  it('should filter list', () => {
    component.list = ['alpha', 'beta', 'gamma'];
    component._list = ['alpha', 'beta', 'gamma'];
    component.filter = 'alp';
    component.filterChanged({});
    expect(component.list).toEqual(['alpha']);
  });

  it('should clear filter', () => {
    component._list = ['alpha', 'beta', 'gamma'];
    component.list = ['alpha'];
    component.filter = 'alp';
    component.searched = true;
    component.clearFilter({ preventDefault: vi.fn() });
    expect(component.filter).toBe('');
    expect(component.list).toEqual(['alpha', 'beta', 'gamma']);
    expect(component.searched).toBe(false);
  });
});
