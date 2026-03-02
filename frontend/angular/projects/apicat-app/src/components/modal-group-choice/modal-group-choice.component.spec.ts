import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { ModalGroupChoiceComponent } from './modal-group-choice.component';

describe('ModalGroupChoiceComponent', () => {
  let component: ModalGroupChoiceComponent;
  const mockModalRef = { hide: vi.fn() } as any;
  const mockTranslate = {} as any;
  const mockApiService = {
    getList: vi.fn().mockReturnValue(of({ content: [] })),
  } as any;
  const mockUtils = {
    _queryToHttpParams: vi.fn().mockReturnValue({}),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiService.getList.mockReturnValue(of({ content: [] }));
    component = new ModalGroupChoiceComponent(mockModalRef, mockTranslate, mockApiService, mockUtils);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize onClose and load gruppi on ngOnInit', () => {
    component.ngOnInit();
    expect(component.onClose).toBeDefined();
    expect(mockApiService.getList).toHaveBeenCalled();
  });

  it('should close modal', () => {
    component.closeModal();
    expect(mockModalRef.hide).toHaveBeenCalled();
  });

  it('should emit selected on onSelected', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.selected = [{ id: 1 }];
    component.onSelected();
    expect(spy).toHaveBeenCalledWith([{ id: 1 }]);
  });

  it('should select all', () => {
    component.gruppi = [{ id: 1 }, { id: 2 }];
    component.onSelectAll();
    expect(component.selected).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should deselect all', () => {
    component.selected = [{ id: 1 }];
    component.onDeselectAll();
    expect(component.selected).toEqual([]);
  });

  it('should set error messages', () => {
    component._setErrorMessages(true);
    expect(component._error).toBe(true);
    expect(component._message).toBe('APP.MESSAGE.ERROR.Default');
  });

  it('should handle select action', () => {
    component.ngOnInit();
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.onAction({ action: 'select', item: { id: 5 } });
    expect(component.selected).toContainEqual({ id: 5 });
  });

  it('should handle API error in _loadGruppi', () => {
    mockApiService.getList.mockReturnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component._spin).toBe(false);
    expect(component._error).toBe(true);
  });
});
