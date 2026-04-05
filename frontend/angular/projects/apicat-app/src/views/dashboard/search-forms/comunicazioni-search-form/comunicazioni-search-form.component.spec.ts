import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ComunicazioniSearchFormComponent } from './comunicazioni-search-form.component';

describe('ComunicazioniSearchFormComponent', () => {
  let component: ComunicazioniSearchFormComponent;

  beforeEach(() => {
    component = new ComunicazioniSearchFormComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default historyStore', () => {
    expect(component.historyStore).toBe('dashboard-comunicazioni');
  });

  it('should have formGroup with q control', () => {
    expect(component._formGroup.get('q')).toBeTruthy();
    expect(component._formGroup.get('q')!.value).toBe('');
  });

  it('should have searchFields with free search', () => {
    expect(component.searchFields.length).toBe(1);
    expect(component.searchFields[0].field).toBe('q');
    expect(component.searchFields[0].type).toBe('string');
  });

  it('should emit search on _onSearch', () => {
    const spy = vi.fn();
    component.search.subscribe(spy);
    const values = { q: 'test' };
    component._onSearch(values);
    expect(spy).toHaveBeenCalledWith(values);
  });
});
