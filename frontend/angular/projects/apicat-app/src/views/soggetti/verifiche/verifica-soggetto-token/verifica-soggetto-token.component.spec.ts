import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { of, throwError } from 'rxjs';
import { VerificaSoggettoTokenComponent } from './verifica-soggetto-token.component';

describe('VerificaSoggettoTokenComponent', () => {
  let component: VerificaSoggettoTokenComponent;
  let mockTranslateService: any;
  let mockApiService: any;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockTranslateService = { instant: vi.fn((k: string) => k) };
    mockApiService = {
      getMonitor: vi.fn().mockReturnValue(of({ esito: 'ok', items: [] })),
    };
    component = new VerificaSoggettoTokenComponent(
      mockTranslateService, mockApiService
    );
  });

  afterEach(() => {
    vi.useRealTimers();
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

  describe('_normalizeResult', () => {
    it('should normalize valido -> ok', () => {
      const result = component._normalizeResult({ esito: 'valido', dettagli: 'test' });
      expect(result.esito).toBe('ok');
      expect(result.dettagli).toBe('test');
    });

    it('should normalize in_scadenza -> warning', () => {
      const result = component._normalizeResult({ esito: 'in_scadenza' });
      expect(result.esito).toBe('warning');
    });

    it('should normalize scaduto -> errore', () => {
      const result = component._normalizeResult({ esito: 'scaduto' });
      expect(result.esito).toBe('errore');
    });

    it('should keep unknown esiti unchanged', () => {
      const result = component._normalizeResult({ esito: 'unknown_value' });
      expect(result.esito).toBe('unknown_value');
    });

    it('should keep ok unchanged', () => {
      const result = component._normalizeResult({ esito: 'ok' });
      expect(result.esito).toBe('ok');
    });

    it('should keep warning unchanged', () => {
      const result = component._normalizeResult({ esito: 'warning' });
      expect(result.esito).toBe('warning');
    });

    it('should keep errore unchanged', () => {
      const result = component._normalizeResult({ esito: 'errore' });
      expect(result.esito).toBe('errore');
    });

    it('should spread all original properties', () => {
      const result = component._normalizeResult({ esito: 'valido', items: [1, 2], extra: 'x' });
      expect(result.items).toEqual([1, 2]);
      expect(result.extra).toBe('x');
      expect(result.esito).toBe('ok');
    });
  });

  describe('_isNotValidoOk', () => {
    it('should return false for valido', () => {
      expect(component._isNotValidoOk({ esito: 'valido' })).toBe(false);
    });

    it('should return false for ok', () => {
      expect(component._isNotValidoOk({ esito: 'ok' })).toBe(false);
    });

    it('should return true for errore', () => {
      expect(component._isNotValidoOk({ esito: 'errore' })).toBe(true);
    });

    it('should return true for warning', () => {
      expect(component._isNotValidoOk({ esito: 'warning' })).toBe(true);
    });

    it('should return true for http_error', () => {
      expect(component._isNotValidoOk({ esito: 'http_error' })).toBe(true);
    });
  });

  describe('_getColor', () => {
    it('should return color for known esito', () => {
      expect(component._getColor({ esito: 'ok' })).toBe('success');
      expect(component._getColor({ esito: 'warning' })).toBe('warning');
      expect(component._getColor({ esito: 'errore' })).toBe('danger');
      expect(component._getColor({ esito: 'valido' })).toBe('success');
      expect(component._getColor({ esito: 'in_scadenza' })).toBe('warning');
      expect(component._getColor({ esito: 'scaduto' })).toBe('danger');
      expect(component._getColor({ esito: 'http_error' })).toBe('danger');
    });

    it('should return secondary for unknown esito', () => {
      expect(component._getColor({ esito: 'unknown' })).toBe('secondary');
    });
  });

  describe('_getColorMapper', () => {
    it('should delegate to _getColor', () => {
      const spy = vi.spyOn(component, '_getColor');
      const data = { esito: 'ok' };
      const result = component._getColorMapper(data);
      expect(spy).toHaveBeenCalledWith(data);
      expect(result).toBe('success');
    });
  });

  describe('_getColorHex', () => {
    it('should return colorHex for known esito', () => {
      expect(component._getColorHex({ esito: 'ok' })).toBe('#a6d75b');
      expect(component._getColorHex({ esito: 'warning' })).toBe('#f0ad4e');
      expect(component._getColorHex({ esito: 'errore' })).toBe('#dd2b0e');
    });

    it('should return default colorHex for unknown esito', () => {
      expect(component._getColorHex({ esito: 'unknown' })).toBe('#f1f1f1');
    });
  });

  describe('_getColorHexMapper', () => {
    it('should delegate to _getColorHex', () => {
      const spy = vi.spyOn(component, '_getColorHex');
      const data = { esito: 'warning' };
      const result = component._getColorHexMapper(data);
      expect(spy).toHaveBeenCalledWith(data);
      expect(result).toBe('#f0ad4e');
    });
  });

  describe('_getLabel', () => {
    it('should return label for known esito', () => {
      expect(component._getLabel({ esito: 'ok' })).toBe('APP.VERIFY.ESITO.Ok');
      expect(component._getLabel({ esito: 'valido' })).toBe('APP.VERIFY.ESITO.Valido');
      expect(component._getLabel({ esito: 'warning' })).toBe('APP.VERIFY.ESITO.Warning');
    });

    it('should return raw esito for unknown esito', () => {
      expect(component._getLabel({ esito: 'custom_esito' })).toBe('custom_esito');
    });
  });

  describe('_getLabelMapper', () => {
    it('should delegate to _getLabel', () => {
      const spy = vi.spyOn(component, '_getLabel');
      const data = { esito: 'errore' };
      const result = component._getLabelMapper(data);
      expect(spy).toHaveBeenCalledWith(data);
      expect(result).toBe('APP.VERIFY.ESITO.Errore');
    });
  });

  describe('_isValidOk', () => {
    it('should return true for valido', () => {
      expect(component._isValidOk({ esito: 'valido' })).toBe(true);
    });

    it('should return true for ok', () => {
      expect(component._isValidOk({ esito: 'ok' })).toBe(true);
    });

    it('should return false for errore', () => {
      expect(component._isValidOk({ esito: 'errore' })).toBe(false);
    });

    it('should return false for null', () => {
      expect(component._isValidOk(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(component._isValidOk(undefined)).toBe(false);
    });
  });

  describe('_isValidOkMapper', () => {
    it('should delegate to _isValidOk', () => {
      const spy = vi.spyOn(component, '_isValidOk');
      const data = { esito: 'ok' };
      const result = component._isValidOkMapper(data);
      expect(spy).toHaveBeenCalledWith(data);
      expect(result).toBe(true);
    });
  });

  describe('_hasErrorVesa', () => {
    it('should update _vgEsito when errors found', () => {
      component._vgEsito = { esito: 'ok' };
      component._hasErrorVesa([
        { result: { esito: 'errore' } },
        { result: { esito: 'ok' } }
      ]);
      expect(component._vgEsito.esito).not.toBe('ok');
    });

    it('should not update _vgEsito when all ok', () => {
      component._vgEsito = { esito: 'ok' };
      component._hasErrorVesa([
        { result: { esito: 'ok' } },
        { result: { esito: 'valido' } }
      ]);
      expect(component._vgEsito.esito).toBe('ok');
    });

    it('should stop at first error', () => {
      component._vgEsito = { esito: 'ok' };
      component._hasErrorVesa([
        { result: { esito: 'warning' } },
        { result: { esito: 'errore' } }
      ]);
      // Should pick up the first non-ok result (warning gets normalized)
      expect(component._vgEsito.esito).not.toBe('ok');
    });

    it('should handle empty array', () => {
      component._vgEsito = { esito: 'ok' };
      component._hasErrorVesa([]);
      expect(component._vgEsito.esito).toBe('ok');
    });
  });

  describe('_vgEsito default', () => {
    it('should have default _vgEsito as ok', () => {
      expect(component._vgEsito).toEqual({ esito: 'ok' });
    });
  });

  describe('_gRes default', () => {
    it('should have empty _gRes by default', () => {
      expect(component._gRes).toEqual([]);
    });
  });

  describe('ngOnChanges', () => {
    it('should update environmentId and reset showDetails', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        environmentId: { currentValue: 'produzione', previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component.environmentId).toBe('produzione');
      expect(component._showDetails).toBe(false);
    });

    it('should set _profilo to pdnd when pdnd is true', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        pdnd: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component._profilo).toBe('pdnd');
    });

    it('should set _profilo to modi when pdnd is false', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        pdnd: { currentValue: false, previousValue: true, firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component._profilo).toBe('modi');
    });

    it('should set _stato to stato when type is backend', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        type: { currentValue: 'backend', previousValue: 'certificati', firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component._stato).toBe('stato');
    });

    it('should set _stato to scaduti when type is certificati', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        type: { currentValue: 'certificati', previousValue: 'backend', firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component._stato).toBe('scaduti');
    });

    it('should update listTokenPolicy and reset vgEsito', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));
      component._vgEsito = { esito: 'errore' };

      component.ngOnChanges({
        listTokenPolicy: { currentValue: ['policy1'], previousValue: [], firstChange: false, isFirstChange: () => false }
      } as any);

      expect(component.listTokenPolicy).toEqual(['policy1']);
      expect(component._vgEsito.esito).toBe('ok');
    });

    it('should update soggetto', () => {
      const newSoggetto = { nome: 'NewSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));

      component.ngOnChanges({
        soggetto: { currentValue: newSoggetto, previousValue: null, firstChange: true, isFirstChange: () => true }
      } as any);

      expect(component.soggetto).toBe(newSoggetto);
    });

    it('should call _loadAll after processing changes', () => {
      component.soggetto = { nome: 'TestSogg' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));
      const spy = vi.spyOn(component, '_loadAll');

      component.ngOnChanges({
        environmentId: { currentValue: 'produzione', previousValue: 'collaudo', firstChange: false, isFirstChange: () => false }
      } as any);

      expect(spy).toHaveBeenCalled();
    });
  });

  describe('_loadAll', () => {
    beforeEach(() => {
      component.soggetto = { nome: 'TestSogg' };
    });

    it('should make request and populate _gRes without token policies', () => {
      // 'errore' esito avoids triggering _loadInScadenza (which would add extra getMonitor calls)
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      component.listTokenPolicy = [];

      component._loadAll();

      expect(mockApiService.getMonitor).toHaveBeenCalledTimes(1);
      expect(mockApiService.getMonitor).toHaveBeenCalledWith('collaudo/soggetti/TestSogg/certificati/scaduti');
      expect(component._gRes.length).toBe(1);
      expect(component._gRes[0].name).toBe('APP.SOGGETTI.TITLE.soggetti');
    });

    it('should make additional requests for each token policy when pdnd is true', () => {
      // 'errore' esito avoids triggering _loadInScadenza
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      component.listTokenPolicy = ['policy1', 'policy2'];
      component.pdnd = true;

      component._loadAll();

      // 1 soggetto + 2 policies = 3 calls (no _loadInScadenza because esito is not ok/valido)
      expect(mockApiService.getMonitor).toHaveBeenCalledTimes(3);
      expect(component._gRes.length).toBe(3);
      expect(component._gRes[1].name).toContain('policy1');
      expect(component._gRes[2].name).toContain('policy2');
    });

    it('should not make token policy requests when pdnd is false', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      component.listTokenPolicy = ['policy1'];
      component.pdnd = false;

      component._loadAll();

      expect(mockApiService.getMonitor).toHaveBeenCalledTimes(1);
      expect(component._gRes.length).toBe(1);
    });

    it('should decrement _loading after forkJoin completes', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      const initialLoading = component._loading;

      component._loadAll();

      expect(component._loading).toBe(initialLoading);
    });

    it('should handle forkJoin error (catchError per request returns fallback)', () => {
      mockApiService.getMonitor.mockReturnValue(throwError(() => new Error('Network error')));
      component._loadAll();

      // catchError wraps each individual call, so forkJoin receives of({ items: [] })
      expect(component._gRes.length).toBe(1);
    });

    it('should call _loadInScadenza when result is valid ok and type is certificati', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'valido', items: [] }));
      component.type = 'certificati';
      const spy = vi.spyOn(component, '_loadInScadenza').mockImplementation(() => {});

      component._loadAll();

      expect(spy).toHaveBeenCalled();
      // loading is still true because _loadInScadenza was mocked (no-op)
      expect(component._gRes[0].loading).toBe(true);
    });

    it('should not call _loadInScadenza when result is not valid ok', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      const spy = vi.spyOn(component, '_loadInScadenza');

      component._loadAll();

      expect(spy).not.toHaveBeenCalled();
      expect(component._gRes[0].loading).toBe(false);
    });

    it('should not call _loadInScadenza for backend type even if valid', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok', items: [] }));
      component.type = 'backend';
      const spy = vi.spyOn(component, '_loadInScadenza');

      component._loadAll();

      expect(spy).not.toHaveBeenCalled();
    });

    it('should reset _showGroupDetails', () => {
      component._showGroupDetails = true;
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));

      component._loadAll();

      expect(component._showGroupDetails).toBe(false);
    });

    it('should call _hasErrorVesa with all results', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      const spy = vi.spyOn(component, '_hasErrorVesa');

      component._loadAll();

      expect(spy).toHaveBeenCalledWith(component._gRes);
    });

    it('should use stato for token policy when type is backend', () => {
      component.type = 'backend';
      component._stato = 'scaduti'; // default
      component.listTokenPolicy = ['policy1'];
      component.pdnd = true;
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));

      component._loadAll();

      // First request uses the initial _stato ('scaduti'), but token policy forEach re-sets _stato to 'stato' for backend
      // The first soggetto call uses _stato as-is (scaduti because it was the default)
      expect(mockApiService.getMonitor).toHaveBeenCalledWith('collaudo/soggetti/TestSogg/backend/scaduti');
      // Token policy call uses 'stato' because forEach re-evaluates for backend
      expect(mockApiService.getMonitor).toHaveBeenCalledWith('collaudo/token-policy/policy1/backend/stato');
    });

    it('should set _gRes index 0 with soggetti name', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      component._loadAll();

      expect(component._gRes[0].index).toBe(0);
      expect(component._gRes[0].open).toBe(false);
    });

    it('should set _gRes index > 0 with token-policy name', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'errore', items: [] }));
      component.listTokenPolicy = ['tp1'];
      component.pdnd = true;
      component._loadAll();

      expect(component._gRes[1].index).toBe(1);
      expect(component._gRes[1].name).toContain('APP.SOGGETTI.TITLE.token-policy');
      expect(component._gRes[1].name).toContain('tp1');
    });

    it('should reset _vgEsito when _loadInScadenza is triggered', () => {
      component._vgEsito = { esito: 'errore' };
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'valido', items: [] }));
      component.type = 'certificati';
      vi.spyOn(component, '_loadInScadenza').mockImplementation(() => {});

      component._loadAll();

      // _vgEsito is reset to 'ok' before calling _loadInScadenza
      expect(component._vgEsito.esito).toBe('ok');
    });
  });

  describe('_loadInScadenza', () => {
    beforeEach(() => {
      component._gRes = [
        { uid: 'x', index: 0, name: 'Test', result: { esito: 'ok' }, open: false, loading: true }
      ];
    });

    it('should return early if path is empty', () => {
      component._loadInScadenza('', 0);
      expect(mockApiService.getMonitor).not.toHaveBeenCalled();
    });

    it('should load in-scadenza data on success', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'in_scadenza', items: [1] }));

      component._loadInScadenza('collaudo/soggetti/TestSogg/certificati', 0);

      expect(mockApiService.getMonitor).toHaveBeenCalledWith('collaudo/soggetti/TestSogg/certificati/in-scadenza');
      expect(component._result).toBeDefined();
      expect(component._result.esito).toBe('warning');
      expect(component._gRes[0].loading).toBe(false);
    });

    it('should update _gRes[index].result on success', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'valido' }));

      component._loadInScadenza('some/path', 0);

      expect(component._gRes[0].result.esito).toBe('ok');
      expect(component._gRes[0].loading).toBe(false);
    });

    it('should call _hasErrorVesa on success', () => {
      mockApiService.getMonitor.mockReturnValue(of({ esito: 'ok' }));
      const spy = vi.spyOn(component, '_hasErrorVesa');

      component._loadInScadenza('some/path', 0);

      expect(spy).toHaveBeenCalledWith(component._gRes);
    });

    it('should handle error in _loadInScadenza', () => {
      mockApiService.getMonitor.mockReturnValue(throwError(() => ({ status: 500, message: 'err' })));

      component._loadInScadenza('some/path', 0);

      expect(component._gRes[0].result.esito).toBe('http_error');
      expect(component._gRes[0].result.dettagli).toContain('some/path');
      expect(component._gRes[0].loading).toBe(false);
      expect(component._gRes[0].open).toBe(false);
    });

    it('should call _hasErrorVesa on error', () => {
      mockApiService.getMonitor.mockReturnValue(throwError(() => new Error('fail')));
      const spy = vi.spyOn(component, '_hasErrorVesa');

      component._loadInScadenza('some/path', 0);

      expect(spy).toHaveBeenCalledWith(component._gRes);
    });
  });

  describe('_onSevaDetails', () => {
    it('should toggle showGroupDetails when esito is not valid/ok', () => {
      component._showGroupDetails = false;
      component._onSevaDetails({}, { esito: 'errore' });
      expect(component._showGroupDetails).toBe(true);

      component._onSevaDetails({}, { esito: 'errore' });
      expect(component._showGroupDetails).toBe(false);
    });

    it('should not toggle showGroupDetails when esito is ok and no altKey', () => {
      component._showGroupDetails = false;
      component._onSevaDetails({}, { esito: 'ok' });
      expect(component._showGroupDetails).toBe(false);
    });

    it('should not toggle showGroupDetails when esito is valido and no altKey', () => {
      component._showGroupDetails = false;
      component._onSevaDetails({}, { esito: 'valido' });
      expect(component._showGroupDetails).toBe(false);
    });

    it('should toggle showGroupDetails when altKey is pressed even if ok', () => {
      component._showGroupDetails = false;
      component._onSevaDetails({ altKey: true }, { esito: 'ok' });
      expect(component._showGroupDetails).toBe(true);
    });

    it('should toggle showGroupDetails when altKey is pressed and valido', () => {
      component._showGroupDetails = false;
      component._onSevaDetails({ altKey: true }, { esito: 'valido' });
      expect(component._showGroupDetails).toBe(true);
    });
  });

  describe('_onErrorDetails', () => {
    it('should toggle item.open', () => {
      const item = { open: false };
      const scrollSpy = vi.spyOn(component, 'scrollToTop').mockImplementation(() => {});
      component._onErrorDetails({}, item, 'divId');
      expect(item.open).toBe(true);
      expect(scrollSpy).toHaveBeenCalledWith('divId');
    });

    it('should toggle item.open from true to false', () => {
      const item = { open: true };
      const scrollSpy = vi.spyOn(component, 'scrollToTop').mockImplementation(() => {});
      component._onErrorDetails({}, item, 'divId');
      expect(item.open).toBe(false);
      expect(scrollSpy).not.toHaveBeenCalled();
    });
  });

  describe('_onDetails', () => {
    it('should toggle showDetails when esito is not valid/ok', () => {
      component._showDetails = false;
      component._onDetails({}, { esito: 'errore' });
      expect(component._showDetails).toBe(true);

      component._onDetails({}, { esito: 'errore' });
      expect(component._showDetails).toBe(false);
    });

    it('should not toggle showDetails when esito is ok', () => {
      component._showDetails = false;
      component._onDetails({}, { esito: 'ok' });
      expect(component._showDetails).toBe(false);
    });

    it('should not toggle showDetails when esito is valido', () => {
      component._showDetails = false;
      component._onDetails({}, { esito: 'valido' });
      expect(component._showDetails).toBe(false);
    });

    it('should toggle for warning esito', () => {
      component._showDetails = false;
      component._onDetails({}, { esito: 'warning' });
      expect(component._showDetails).toBe(true);
    });
  });

  describe('scrollToBottom', () => {
    it('should call scrollTo on the element if found', () => {
      const mockDiv = { scrollHeight: 500, scrollTo: vi.fn() };
      vi.spyOn(document, 'getElementById').mockReturnValue(mockDiv as any);

      component.scrollToBottom();

      expect(mockDiv.scrollTo).toHaveBeenCalledWith({
        top: 500,
        behavior: 'smooth'
      });
    });

    it('should not throw when element is not found', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      expect(() => component.scrollToBottom()).not.toThrow();
    });
  });

  describe('scrollToTop', () => {
    it('should scroll to the target element within scroller after timeout', () => {
      const mockScroller = { scrollTo: vi.fn(), offsetTop: 10 };
      const mockDiv = { offsetTop: 100 };
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === component.uid) return mockScroller as any;
        if (id === 'targetDiv') return mockDiv as any;
        return null;
      });

      component.scrollToTop('targetDiv');
      vi.advanceTimersByTime(200);

      expect(mockScroller.scrollTo).toHaveBeenCalledWith({
        top: 90,
        behavior: 'smooth'
      });
    });

    it('should not throw when scroller or div is not found', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      component.scrollToTop('nonexistent');
      vi.advanceTimersByTime(200);
      // No error expected
    });

    it('should not scroll if only scroller is found but not div', () => {
      const mockScroller = { scrollTo: vi.fn(), offsetTop: 10 };
      vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
        if (id === component.uid) return mockScroller as any;
        return null;
      });

      component.scrollToTop('missing');
      vi.advanceTimersByTime(200);

      expect(mockScroller.scrollTo).not.toHaveBeenCalled();
    });
  });

  describe('_profilo', () => {
    it('should default to empty string', () => {
      expect(component._profilo).toBe('');
    });
  });
});
