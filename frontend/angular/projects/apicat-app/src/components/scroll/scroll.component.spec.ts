import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { ScrollComponent } from './scroll.component';

describe('ScrollComponent', () => {
  let component: ScrollComponent;

  beforeEach(() => {
    component = new ScrollComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have scrollToTop output', () => {
    expect(component.scrollToTop).toBeDefined();
  });

  it('should emit scrollToTop event', () => {
    const spy = vi.fn();
    component.scrollToTop.subscribe(spy);
    component.onScrollToTop();
    expect(spy).toHaveBeenCalled();
  });

  it('should render a button with an accessible name', () => {
    TestBed.configureTestingModule({ imports: [ScrollComponent, TranslateModule.forRoot()] });
    const fixture = TestBed.createComponent(ScrollComponent);
    fixture.detectChanges();
    const pulsante = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(pulsante.getAttribute('type')).toBe('button');
    expect(pulsante.getAttribute('aria-label')).toBe('APP.BUTTON.ScrollToTop');
  });
});
