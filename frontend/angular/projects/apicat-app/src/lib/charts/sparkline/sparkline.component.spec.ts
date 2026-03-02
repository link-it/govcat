import { describe, it, expect, beforeEach } from 'vitest';
import { ScaleType } from '@swimlane/ngx-charts';
import { SparklineComponent } from './sparkline.component';

describe('SparklineComponent', () => {
  let component: SparklineComponent;

  beforeEach(() => {
    component = new SparklineComponent(
      {} as any, // element
      {} as any, // ngZone
      {} as any, // cd
      undefined as any, // platformId
    );
    component.results = [
      { name: 'Series A', series: [{ name: 'a', value: 10 }, { name: 'b', value: 20 }] },
      { name: 'Series B', series: [{ name: 'a', value: 5 }, { name: 'b', value: 15 }] },
    ];
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default autoScale false', () => {
    expect(component.autoScale).toBe(false);
  });

  it('should have default schemeType Linear', () => {
    expect(component.schemeType).toBe(ScaleType.Linear);
  });

  it('should have default animations true', () => {
    expect(component.animations).toBe(true);
  });

  it('should have margin [0,0,0,0]', () => {
    expect(component.margin).toEqual([0, 0, 0, 0]);
  });

  it('should return yDomain from valueDomain when set', () => {
    component.valueDomain = [0, 100];
    expect(component.getYDomain()).toEqual([0, 100]);
  });

  it('should compute yDomain from results when valueDomain not set', () => {
    const yDomain = component.getYDomain();
    expect(yDomain[0]).toBe(0);
    expect(yDomain[1]).toBe(20);
  });

  it('should compute yDomain with autoScale preserving min', () => {
    component.autoScale = true;
    const yDomain = component.getYDomain();
    expect(yDomain[0]).toBe(5);
    expect(yDomain[1]).toBe(20);
  });

  it('should return series domain as array of names', () => {
    expect(component.getSeriesDomain()).toEqual(['Series A', 'Series B']);
  });

  it('should trackBy return item name', () => {
    expect(component.trackBy(0, { name: 'test' })).toBe('test');
  });

  it('should isDate return true for Date instances', () => {
    expect(component.isDate(new Date())).toBe(true);
    expect(component.isDate('2025-01-01')).toBe(false);
    expect(component.isDate(123)).toBe(false);
  });

  it('should getScaleType return Time for dates', () => {
    expect(component.getScaleType([new Date(), new Date()])).toBe(ScaleType.Time);
  });

  it('should getScaleType return Linear for numbers', () => {
    expect(component.getScaleType([1, 2, 3])).toBe(ScaleType.Linear);
  });

  it('should getScaleType return Ordinal for strings', () => {
    expect(component.getScaleType(['a', 'b'])).toBe(ScaleType.Ordinal);
  });

  it('should getYScale return a scale function', () => {
    const scale = component.getYScale([0, 100], 200);
    expect(typeof scale).toBe('function');
    expect(scale(0)).toBe(200);
    expect(scale(100)).toBe(0);
  });
});
