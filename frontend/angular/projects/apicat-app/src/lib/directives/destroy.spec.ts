import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Destroy } from './destroy';

describe('Destroy', () => {
  let destroy: Destroy;

  beforeEach(() => {
    destroy = new Destroy();
  });

  it('should create', () => {
    expect(destroy).toBeTruthy();
  });

  it('should be an Observable', () => {
    expect(typeof destroy.subscribe).toBe('function');
  });

  it('should emit on ngOnDestroy', () => {
    const spy = vi.fn();
    destroy.subscribe(spy);

    destroy.ngOnDestroy();

    expect(spy).toHaveBeenCalled();
  });

  it('should complete on ngOnDestroy', () => {
    const completeSpy = vi.fn();
    destroy.subscribe({ complete: completeSpy });

    destroy.ngOnDestroy();

    expect(completeSpy).toHaveBeenCalled();
  });

  it('should emit to late subscribers (ReplaySubject)', () => {
    destroy.ngOnDestroy();

    const spy = vi.fn();
    destroy.subscribe(spy);

    expect(spy).toHaveBeenCalled();
  });

  it('should work with takeUntil pattern', async () => {
    const { of, takeUntil, toArray } = await import('rxjs');
    const values: number[] = [];

    of(1, 2, 3).pipe(
      takeUntil(destroy)
    ).subscribe(v => values.push(v));

    expect(values).toEqual([1, 2, 3]);
  });
});
