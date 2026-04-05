import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MultiSnackbarComponent } from './multi-snackbar.component';

describe('MultiSnackbarComponent', () => {
  let component: MultiSnackbarComponent;

  beforeEach(() => {
    // Clean static state before each test
    MultiSnackbarComponent.MultiSnackbar = [];
    clearInterval(MultiSnackbarComponent._Timer);
    component = new MultiSnackbarComponent();
  });

  afterEach(() => {
    component.ngOnDestroy();
    MultiSnackbarComponent.MultiSnackbar = [];
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have color definitions', () => {
    expect(component._colors.default).toBeTruthy();
    expect(component._colors.success).toBeTruthy();
    expect(component._colors.danger).toBeTruthy();
    expect(component._colors.warning).toBeTruthy();
    expect(component._colors.info).toBeTruthy();
  });

  it('should push message via static PushMessage', () => {
    MultiSnackbarComponent.PushMessage('Test message');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(1);
    expect(MultiSnackbarComponent.MultiSnackbar[0].message).toBe('Test message');
  });

  it('should push message with action', () => {
    MultiSnackbarComponent.PushMessage('Test', true);
    expect(MultiSnackbarComponent.MultiSnackbar[0].action).toBe('Chiudi');
  });

  it('should push message without action', () => {
    MultiSnackbarComponent.PushMessage('Test', false);
    expect(MultiSnackbarComponent.MultiSnackbar[0].action).toBeNull();
  });

  it('should push message with custom action label', () => {
    MultiSnackbarComponent.PushMessage('Test', true, false, 'Dismiss');
    expect(MultiSnackbarComponent.MultiSnackbar[0].action).toBe('Dismiss');
  });

  it('should push message with type', () => {
    MultiSnackbarComponent.PushMessage('Success!', true, false, null, null, 'success');
    expect(MultiSnackbarComponent.MultiSnackbar[0].type).toBe('success');
  });

  it('should not push duplicate messages with same uuid', () => {
    MultiSnackbarComponent.PushMessage('Test', true, false, null, 'uuid-1');
    MultiSnackbarComponent.PushMessage('Test2', true, false, null, 'uuid-1');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(1);
  });

  it('should allow messages with different uuids', () => {
    MultiSnackbarComponent.PushMessage('Test1', true, false, null, 'uuid-1');
    MultiSnackbarComponent.PushMessage('Test2', true, false, null, 'uuid-2');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(2);
  });

  it('should not push empty message', () => {
    MultiSnackbarComponent.PushMessage('');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(0);
  });

  it('should destroy sticky message by uuid', () => {
    MultiSnackbarComponent.PushMessage('Test', true, true, null, 'uuid-1');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(1);

    MultiSnackbarComponent.DestroyStickyMessage('uuid-1');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(0);
  });

  it('should destroy all sticky messages', () => {
    MultiSnackbarComponent.PushMessage('Test1', true, true, null, 'uuid-1');
    MultiSnackbarComponent.PushMessage('Test2', true, true, null, 'uuid-2');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(2);

    MultiSnackbarComponent.DestroyAllStickyMessages();
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(0);
  });

  it('should clean message by index', () => {
    MultiSnackbarComponent.PushMessage('Test1');
    MultiSnackbarComponent.PushMessage('Test2');
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(2);

    component.__cleanMessage(0);
    expect(MultiSnackbarComponent.MultiSnackbar.length).toBe(1);
    expect(MultiSnackbarComponent.MultiSnackbar[0].message).toBe('Test2');
  });

  it('should emit cleaned message on MessageClean subject', () => {
    const spy = vi.fn();
    MultiSnackbarComponent.MessageClean.subscribe(spy);

    MultiSnackbarComponent.PushMessage('Test');
    component.__cleanMessage(0);

    expect(spy).toHaveBeenCalled();
  });

  it('should not throw on ngOnDestroy', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });

  it('should have static Duration default', () => {
    expect(MultiSnackbarComponent.Duration).toBe(5000);
  });
});
