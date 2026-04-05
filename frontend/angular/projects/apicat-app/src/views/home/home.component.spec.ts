import { describe, it, expect, vi, beforeEach } from 'vitest';
import { of } from 'rxjs';
import { Tools } from '@linkit/components';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  const mockRoute = {} as any;
  const mockRouter = {} as any;
  const mockTranslate = {
    onLangChange: of({ lang: 'it' }),
  } as any;
  const mockConfigService = {
    getConfiguration: vi.fn().mockReturnValue({ AppConfig: {} }),
  } as any;
  const mockTools = {} as any;
  const mockEventsManager = {} as any;

  beforeEach(() => {
    vi.clearAllMocks();
    Tools.ScrollTo = vi.fn();
    component = new HomeComponent(
      mockRoute, mockRouter, mockTranslate,
      mockConfigService, mockTools, mockEventsManager
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have static Name', () => {
    expect(HomeComponent.Name).toBe('HomeComponent');
  });

  it('should toggle filter on construction', () => {
    expect(component._toggleFilter).toBe(true);
  });

  it('should have breadcrumbs', () => {
    expect(component.breadcrumbs.length).toBe(1);
    expect(component.breadcrumbs[0].label).toBe('APP.TITLE.Home');
  });

  it('should have sortFields', () => {
    expect(component.sortFields.length).toBe(5);
  });

  it('should toggle filter and scroll to top', () => {
    component._toggleFilter = true;
    component.__toggleFilter();
    expect(component._toggleFilter).toBe(false);
  });

  it('should scroll to top when filter is shown', () => {
    component._toggleFilter = false;
    component.__toggleFilter();
    expect(component._toggleFilter).toBe(true);
    expect(Tools.ScrollTo).toHaveBeenCalledWith(0);
  });
});
