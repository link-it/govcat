import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VerificaApiComponent } from './verifica-api.component';
import { ViewType } from '../verifiche.component';

describe('VerificaApiComponent', () => {
  let component: VerificaApiComponent;

  const mockUtilService = {
    GetErrorMsg: vi.fn().mockReturnValue('Error'),
    _queryToHttpParams: vi.fn().mockReturnValue({})
  } as any;

  const mockApiService = {
    getMonitor: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    getDetails: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
    getList: vi.fn().mockReturnValue({ subscribe: vi.fn() })
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    component = new VerificaApiComponent(mockUtilService, mockApiService);
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should have default input values', () => {
    expect(component.environmentId).toBe('collaudo');
    expect(component.verifica).toBe('erogazioni');
    expect(component.provider).toBe('');
    expect(component.pdnd).toBe(true);
    expect(component.type).toBe('certificati');
    expect(component.api).toBeNull();
    expect(component.service).toBeNull();
    expect(component.config).toBeNull();
    expect(component.showInfo).toBe(true);
    expect(component.icon).toBe('');
    expect(component.iconSvg).toBe('');
    expect(component.title).toBe('APP.TITLE.Certificati');
    expect(component.reduced).toBe(false);
    expect(component.compact).toBe(false);
    expect(component.adhesions).toEqual([]);
    expect(component.viewType).toBe(ViewType.All);
    expect(component.path).toBe('');
    expect(component.period).toEqual({});
  });

  it('should have default internal state', () => {
    expect(component._profilo).toBe('');
    expect(component._stato).toBe('scaduti');
    expect(component._loading).toBe(true);
    expect(component._result).toBeNull();
    expect(component._showVesaDetails).toBe(false);
    expect(component._showDetails).toBe(false);
  });

  it('should expose ViewType enum', () => {
    expect(component.ViewType).toBe(ViewType);
  });

  it('should have uid as a random string', () => {
    expect(typeof component.uid).toBe('string');
    expect(component.uid.length).toBe(5);
  });

  it('should have _esiti array with predefined values', () => {
    expect(component._esiti.length).toBe(7);
    expect(component._esiti[0].value).toBe('valido');
    expect(component._esiti[6].value).toBe('errore');
  });

  it('should normalize result correctly for valido', () => {
    const result = component._normalizeResult({ esito: 'valido', dettagli: 'test' });
    expect(result.esito).toBe('ok');
  });

  it('should normalize result correctly for in_scadenza', () => {
    const result = component._normalizeResult({ esito: 'in_scadenza' });
    expect(result.esito).toBe('warning');
  });

  it('should normalize result correctly for scaduto', () => {
    const result = component._normalizeResult({ esito: 'scaduto' });
    expect(result.esito).toBe('errore');
  });

  it('should keep esito unchanged for unknown values', () => {
    const result = component._normalizeResult({ esito: 'unknown' });
    expect(result.esito).toBe('unknown');
  });

  it('should return true for _isValidOk with ok esito', () => {
    expect(component._isValidOk({ esito: 'ok' })).toBe(true);
  });

  it('should return true for _isValidOk with valido esito', () => {
    expect(component._isValidOk({ esito: 'valido' })).toBe(true);
  });

  it('should return false for _isValidOk with errore esito', () => {
    expect(component._isValidOk({ esito: 'errore' })).toBe(false);
  });

  it('should return false for _isValidOk with null', () => {
    expect(component._isValidOk(null)).toBe(false);
  });

  it('should return true for _isNotValidoOk with errore', () => {
    expect(component._isNotValidoOk({ esito: 'errore' })).toBe(true);
  });

  it('should return false for _isNotValidoOk with ok', () => {
    expect(component._isNotValidoOk({ esito: 'ok' })).toBe(false);
  });

  it('should return correct color for _getColor', () => {
    expect(component._getColor({ esito: 'ok' })).toBe('success');
    expect(component._getColor({ esito: 'warning' })).toBe('warning');
    expect(component._getColor({ esito: 'errore' })).toBe('danger');
    expect(component._getColor({ esito: 'unknown' })).toBe('secondary');
  });

  it('should return correct hex color for _getColorHex', () => {
    expect(component._getColorHex({ esito: 'ok' })).toBe('#a6d75b');
    expect(component._getColorHex({ esito: 'unknown' })).toBe('transparent');
  });

  it('should return correct label for _getLabel', () => {
    expect(component._getLabel({ esito: 'ok' })).toBe('APP.VERIFY.ESITO.Ok');
    expect(component._getLabel({ esito: 'unknown' })).toBe('unknown');
  });

  it('should return soggetto nome from service for erogazioni', () => {
    component.service = { soggetto_interno: { nome: 'SoggettoInterno' }, dominio: { soggetto_referente: { nome: 'SoggettoRef' } } };
    expect(component._getSoggettoNome('erogazioni')).toBe('SoggettoInterno');
  });

  it('should return soggetto referente when soggetto_interno is missing', () => {
    component.service = { dominio: { soggetto_referente: { nome: 'SoggettoRef' } } };
    expect(component._getSoggettoNome('erogazioni')).toBe('SoggettoRef');
  });
});
