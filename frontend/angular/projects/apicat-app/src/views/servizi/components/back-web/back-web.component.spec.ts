import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BackWebComponent } from './back-web.component';

describe('BackWebComponent', () => {
  let component: BackWebComponent;

  const mockRouter = {
    navigate: vi.fn()
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new BackWebComponent(mockRouter);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have service_id default to null', () => {
    expect(component.service_id).toBeNull();
  });

  it('should navigate to presentation view on backPresentationView', () => {
    component.service_id = '123';
    component.backPresentationView();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/123/view']);
  });

  it('should navigate with null service_id', () => {
    component.backPresentationView();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/servizi/null/view']);
  });
});
