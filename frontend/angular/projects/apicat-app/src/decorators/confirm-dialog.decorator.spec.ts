import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { needConfirmation } from './confirm-dialog.decorator';
import { DialogService } from './services/dialog.service';

describe('needConfirmation decorator', () => {

  let mockDialogService: any;
  let onCloseSubject: Subject<boolean>;

  beforeEach(() => {
    onCloseSubject = new Subject<boolean>();
    mockDialogService = {
      openDialog: vi.fn().mockReturnValue(onCloseSubject.asObservable())
    };

    // Set up the static instance
    vi.spyOn(DialogService, 'getInstance').mockReturnValue(mockDialogService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return a decorator function', () => {
    const decorator = needConfirmation();
    expect(typeof decorator).toBe('function');
  });

  it('should return a property descriptor', () => {
    const decorator = needConfirmation();
    const descriptor: PropertyDescriptor = {
      value: vi.fn()
    };
    const result = decorator({}, 'testMethod', descriptor);
    expect(result).toBeDefined();
    expect(typeof result.value).toBe('function');
  });

  it('should call DialogService.openDialog when decorated method is invoked', () => {
    const decorator = needConfirmation();
    const originalMethod = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalMethod };

    const result = decorator({}, 'testMethod', descriptor);
    const context = { someProperty: 'value' };

    result.value.call(context, 'arg1', 'arg2');

    expect(mockDialogService.openDialog).toHaveBeenCalledTimes(1);
  });

  it('should use default initialState when no arguments given', () => {
    const decorator = needConfirmation();
    const descriptor: PropertyDescriptor = { value: vi.fn() };

    const result = decorator({}, 'testMethod', descriptor);
    result.value.call({});

    const callArgs = mockDialogService.openDialog.mock.calls[0][0];
    expect(callArgs.title).toBe('APP.TITLE.Attention');
    expect(callArgs.messages).toEqual(['APP.MESSAGE.AreYouSure']);
    expect(callArgs.cancelText).toBe('APP.BUTTON.Cancel');
    expect(callArgs.confirmText).toBe('APP.BUTTON.Confirm');
    expect(callArgs.confirmColor).toBe('danger');
  });

  it('should use custom config when provided', () => {
    const customConfig = {
      title: 'Custom Title',
      messages: ['Custom message'],
      cancelText: 'No',
      confirmText: 'Yes',
      confirmColor: 'primary'
    };
    const decorator = needConfirmation(customConfig);
    const descriptor: PropertyDescriptor = { value: vi.fn() };

    const result = decorator({}, 'testMethod', descriptor);
    result.value.call({});

    expect(mockDialogService.openDialog).toHaveBeenCalledWith(customConfig, expect.anything());
  });

  it('should call original method when dialog returns true (confirmed)', () => {
    const decorator = needConfirmation();
    const originalMethod = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalMethod };

    const result = decorator({}, 'testMethod', descriptor);
    const context = { someProperty: 'value' };

    result.value.call(context, 'arg1', 'arg2');
    onCloseSubject.next(true);

    expect(originalMethod).toHaveBeenCalledTimes(1);
    expect(originalMethod).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('should call original method with correct this context', () => {
    const decorator = needConfirmation();
    const originalMethod = vi.fn(function(this: any) {
      return this.someProperty;
    });
    const descriptor: PropertyDescriptor = { value: originalMethod };

    const result = decorator({}, 'testMethod', descriptor);
    const context = { someProperty: 'contextValue' };

    result.value.call(context);
    onCloseSubject.next(true);

    expect(originalMethod.mock.instances[0]).toBe(context);
  });

  it('should NOT call original method when dialog returns false (cancelled)', () => {
    const decorator = needConfirmation();
    const originalMethod = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalMethod };

    const result = decorator({}, 'testMethod', descriptor);
    result.value.call({});
    onCloseSubject.next(false);

    expect(originalMethod).not.toHaveBeenCalled();
  });

  it('should not call original method if dialog service instance is null', () => {
    vi.spyOn(DialogService, 'getInstance').mockReturnValue(null);

    const decorator = needConfirmation();
    const originalMethod = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalMethod };

    const result = decorator({}, 'testMethod', descriptor);
    // Should not throw, just silently do nothing
    result.value.call({});

    expect(originalMethod).not.toHaveBeenCalled();
  });

  it('should work as a class method decorator', () => {
    const decorator = needConfirmation();
    const originalMethod = vi.fn();

    class TestClass {
      value = 42;
    }

    const descriptor: PropertyDescriptor = { value: originalMethod };
    const result = decorator(TestClass.prototype, 'doSomething', descriptor);

    const instance = new TestClass();
    result.value.call(instance, 'a', 'b');
    onCloseSubject.next(true);

    expect(originalMethod).toHaveBeenCalledWith('a', 'b');
  });
});
