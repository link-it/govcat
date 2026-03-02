import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificaSoggettoTokenComponent } from './verifica-soggetto-token.component';

describe('VerificaSoggettoTokenComponent', () => {
  let component: VerificaSoggettoTokenComponent;
  const mockTranslateService = { instant: vi.fn((k: string) => k) } as any;
  const mockApiService = {
    getMonitor: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslateService.instant.mockImplementation((k: string) => k);
    component = new VerificaSoggettoTokenComponent(
      mockTranslateService, mockApiService
    );
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should not have static Name', () => {
    expect((VerificaSoggettoTokenComponent as any).Name).toBeUndefined();
  });

  it('should have default input values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.pdnd).toBe(true);
    expect(component.soggetto).toBeNull();
    expect(component.verifica).toBe('soggetti');
    expect(component.type).toBe('certificati');
    expect(component.listTokenPolicy).toEqual([]);
    expect(component.showInfo).toBe(true);
    expect(component.icon).toBe('');
    expect(component.iconSvg).toBe('');
    expect(component.title).toBe('APP.TITLE.Certificati');
  });

  it('should have uid generated', () => {
    expect(component.uid).toBeTruthy();
    expect(component.uid.length).toBeGreaterThan(0);
  });

  it('should have default stato as scaduti', () => {
    expect(component._stato).toBe('scaduti');
  });

  it('should have loading at 0', () => {
    expect(component._loading).toBe(0);
  });

  it('should have null result by default', () => {
    expect(component._result).toBeNull();
  });

  it('should have showGroupDetails as false by default', () => {
    expect(component._showGroupDetails).toBe(false);
  });

  it('should have showDetails as false by default', () => {
    expect(component._showDetails).toBe(false);
  });

  it('should have esiti list with expected values', () => {
    expect(component._esiti.length).toBe(7);
    const values = component._esiti.map((e: any) => e.value);
    expect(values).toContain('valido');
    expect(values).toContain('in_scadenza');
    expect(values).toContain('scaduto');
    expect(values).toContain('http_error');
    expect(values).toContain('ok');
    expect(values).toContain('warning');
    expect(values).toContain('errore');
  });

  it('should have correct colors for esiti', () => {
    const valido = component._esiti.find((e: any) => e.value === 'valido');
    expect(valido.color).toBe('success');
    expect(valido.colorHex).toBe('#a6d75b');

    const scaduto = component._esiti.find((e: any) => e.value === 'scaduto');
    expect(scaduto.color).toBe('danger');
    expect(scaduto.colorHex).toBe('#dd2b0e');

    const inScadenza = component._esiti.find((e: any) => e.value === 'in_scadenza');
    expect(inScadenza.color).toBe('warning');
    expect(inScadenza.colorHex).toBe('#f0ad4e');
  });

  it('should normalize result: valido -> ok', () => {
    const result = component._normalizeResult({ esito: 'valido', dettagli: 'test' });
    expect(result.esito).toBe('ok');
    expect(result.dettagli).toBe('test');
  });

  it('should normalize result: in_scadenza -> warning', () => {
    const result = component._normalizeResult({ esito: 'in_scadenza' });
    expect(result.esito).toBe('warning');
  });

  it('should normalize result: scaduto -> errore', () => {
    const result = component._normalizeResult({ esito: 'scaduto' });
    expect(result.esito).toBe('errore');
  });

  it('should keep unknown esiti unchanged in normalizeResult', () => {
    const result = component._normalizeResult({ esito: 'unknown_value' });
    expect(result.esito).toBe('unknown_value');
  });

  it('should detect not-valid-ok correctly with _isNotValidoOk', () => {
    expect(component._isNotValidoOk({ esito: 'valido' })).toBe(false);
    expect(component._isNotValidoOk({ esito: 'ok' })).toBe(false);
    expect(component._isNotValidoOk({ esito: 'errore' })).toBe(true);
    expect(component._isNotValidoOk({ esito: 'warning' })).toBe(true);
    expect(component._isNotValidoOk({ esito: 'http_error' })).toBe(true);
  });

  it('should return color for known esito with _getColor', () => {
    expect(component._getColor({ esito: 'ok' })).toBe('success');
    expect(component._getColor({ esito: 'warning' })).toBe('warning');
    expect(component._getColor({ esito: 'errore' })).toBe('danger');
  });

  it('should return secondary for unknown esito with _getColor', () => {
    expect(component._getColor({ esito: 'unknown' })).toBe('secondary');
  });

  it('should return colorHex for known esito with _getColorHex', () => {
    expect(component._getColorHex({ esito: 'ok' })).toBe('#a6d75b');
    expect(component._getColorHex({ esito: 'warning' })).toBe('#f0ad4e');
    expect(component._getColorHex({ esito: 'errore' })).toBe('#dd2b0e');
  });

  it('should return default colorHex for unknown esito', () => {
    expect(component._getColorHex({ esito: 'unknown' })).toBe('#f1f1f1');
  });

  it('should return label for known esito with _getLabel', () => {
    expect(component._getLabel({ esito: 'ok' })).toBe('APP.VERIFY.ESITO.Ok');
    expect(component._getLabel({ esito: 'valido' })).toBe('APP.VERIFY.ESITO.Valido');
  });

  it('should return raw esito for unknown esito with _getLabel', () => {
    expect(component._getLabel({ esito: 'custom_esito' })).toBe('custom_esito');
  });

  it('should detect valid-ok correctly with _isValidOk', () => {
    expect(component._isValidOk({ esito: 'valido' })).toBe(true);
    expect(component._isValidOk({ esito: 'ok' })).toBe(true);
    expect(component._isValidOk({ esito: 'errore' })).toBe(false);
    expect(component._isValidOk(null)).toBe(false);
  });

  it('should update _vgEsito via _hasErrorVesa when errors found', () => {
    component._vgEsito = { esito: 'ok' };
    component._hasErrorVesa([
      { result: { esito: 'errore' } },
      { result: { esito: 'ok' } }
    ]);
    expect(component._vgEsito.esito).not.toBe('ok');
  });

  it('should not update _vgEsito via _hasErrorVesa when all ok', () => {
    component._vgEsito = { esito: 'ok' };
    component._hasErrorVesa([
      { result: { esito: 'ok' } },
      { result: { esito: 'valido' } }
    ]);
    expect(component._vgEsito.esito).toBe('ok');
  });

  it('should have default _vgEsito as ok', () => {
    expect(component._vgEsito).toEqual({ esito: 'ok' });
  });

  it('should have empty _gRes by default', () => {
    expect(component._gRes).toEqual([]);
  });
});
