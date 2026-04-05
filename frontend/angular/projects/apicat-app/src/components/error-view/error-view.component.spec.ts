import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleChange } from '@angular/core';
import { ErrorViewComponent } from './error-view.component';
import { Tools } from '@linkit/components';

describe('ErrorViewComponent', () => {
  let component: ErrorViewComponent;

  beforeEach(() => {
    component = new ErrorViewComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have null title by default', () => {
    expect(component.title).toBeNull();
  });

  it('should have empty errors by default', () => {
    expect(component.errors).toEqual([]);
  });

  it('should not show close by default', () => {
    expect(component.showClose).toBe(false);
  });

  it('should update title on ngOnChanges', () => {
    component.ngOnChanges({ title: new SimpleChange(null, 'New Title', false) });
    expect(component.title).toBe('New Title');
  });

  it('should update errors on ngOnChanges', () => {
    const errors = [{ tipo: 'error1' }];
    component.ngOnChanges({ errors: new SimpleChange([], errors, false) });
    expect(component.errors).toBe(errors);
  });

  it('should emit onClose when closeMessages is called', () => {
    const spy = vi.fn();
    component.onClose.subscribe(spy);
    component.closeMessages();
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should return field when no custom label found', () => {
    Tools.CustomFieldsLabel = [];
    expect(component._getCustomFieldLabel('unknownField')).toBe('unknownField');
  });

  it('should return false for _hasCustomFieldLabel with unknown field', () => {
    Tools.CustomFieldsLabel = [];
    expect(component._hasCustomFieldLabel('unknownField')).toBe(false);
  });

  it('should join sottotipo types', () => {
    const sottotipo = [{ tipo: 'a' }, { tipo: 'b' }];
    expect(component._getSottotipoKey(sottotipo)).toBe('a.b');
  });
});
