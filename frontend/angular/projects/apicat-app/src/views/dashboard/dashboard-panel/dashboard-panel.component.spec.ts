import { describe, it, expect, beforeEach } from 'vitest';
import { DashboardPanelComponent } from './dashboard-panel.component';

describe('DashboardPanelComponent', () => {
  let component: DashboardPanelComponent;

  beforeEach(() => {
    component = new DashboardPanelComponent();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default values', () => {
    expect(component.title).toBe('');
    expect(component.icon).toBe('');
    expect(component.items).toEqual([]);
    expect(component.totalCount).toBe(0);
    expect(component.panelType).toBe('servizi');
    expect(component.loading).toBe(false);
    expect(component.borderColor).toBe('#0d6efd');
    expect(component.hideVersions).toBe(false);
    expect(component.statusConfig).toEqual({});
  });

  it('should emit viewAll with panelType', () => {
    const spy = { called: false, value: '' };
    component.viewAll.subscribe((v: string) => { spy.called = true; spy.value = v; });
    component.panelType = 'adesioni';
    component.onViewAll();
    expect(spy.called).toBe(true);
    expect(spy.value).toBe('adesioni');
  });

  it('should emit viewItem with item', () => {
    const spy = { called: false, value: null as any };
    component.viewItem.subscribe((v: any) => { spy.called = true; spy.value = v; });
    const item = { id: '1', nome: 'Test' };
    component.onViewItem(item);
    expect(spy.called).toBe(true);
    expect(spy.value).toBe(item);
  });

  it('should return status style from config', () => {
    component.statusConfig = {
      'pubblicato': { label: 'Pubblicato', background: '#28a745', color: '#fff' }
    };
    const style = component.getStatusStyle('pubblicato');
    expect(style['background-color']).toBe('#28a745');
    expect(style['color']).toBe('#fff');
    expect(style['border']).toBe('none');
  });

  it('should return default status style for unknown stato', () => {
    const style = component.getStatusStyle('unknown');
    expect(style['background-color']).toBe('#6c757d');
    expect(style['color']).toBe('#ffffff');
  });

  it('should return status label from config', () => {
    component.statusConfig = {
      'pubblicato': { label: 'Pubblicato', background: '', color: '' }
    };
    expect(component.getStatusLabel('pubblicato')).toBe('Pubblicato');
  });

  it('should return stato as label when not configured', () => {
    expect(component.getStatusLabel('sconosciuto')).toBe('sconosciuto');
  });

  it('should format date in Italian format', () => {
    const result = component.formatDate('2026-03-01T12:00:00');
    expect(result).toMatch(/01\/03\/2026/);
  });

  it('should return empty string for empty date', () => {
    expect(component.formatDate('')).toBe('');
  });
});
