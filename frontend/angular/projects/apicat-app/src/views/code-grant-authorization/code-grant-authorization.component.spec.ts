import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Subject } from 'rxjs';
import { CodeGrantAuthorizationComponent } from './code-grant-authorization.component';

describe('CodeGrantAuthorizationComponent', () => {
  let component: CodeGrantAuthorizationComponent;
  const queryParams$ = new Subject<any>();
  const mockRoute = {
    queryParams: queryParams$.asObservable(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new CodeGrantAuthorizationComponent(mockRoute);
  });

  afterEach(() => {
    component.broadcastChannel.close();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.data).toBeNull();
    expect(component.spin).toBe(true);
    expect(component.debug).toBe(false);
  });

  it('should have a logo path', () => {
    expect(component.logo).toContain('linkit_logo');
  });

  it('should parse query params on ngOnInit', () => {
    vi.useFakeTimers();
    component.ngOnInit();
    queryParams$.next({ return: 'ok', session_state: 'abc', code: '123' });
    expect(component.data).toEqual({ return: 'ok', session_state: 'abc', code: '123' });
    vi.useRealTimers();
  });

  it('should close broadcast channel on destroy', () => {
    const spy = vi.spyOn(component.broadcastChannel, 'close');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});
