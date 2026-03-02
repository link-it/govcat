import { describe, it, expect, beforeEach } from 'vitest';
import {
  ServiceGroupFilterPipe,
  ServiceFilterPipe,
  GroupFilterPipe,
  DominiFilterListPipe,
  PropertyFilterPipe,
  RisorseFilterPipe,
  AuthFilterPipe
} from './service-filters';

describe('ServiceGroupFilterPipe', () => {
  let pipe: ServiceGroupFilterPipe;

  beforeEach(() => { pipe = new ServiceGroupFilterPipe(); });

  it('should return items as-is when null', () => {
    expect(pipe.transform(null as any, '', {}, '')).toBeNull();
  });

  it('should filter groups by value and stato', () => {
    const dictionary: any = {
      g1: [
        { idServizio: 'api-test', descrizione: 'Test API', stato: 'attivo' },
        { idServizio: 'api-other', descrizione: 'Other', stato: 'bozza' }
      ]
    };
    const items = [{ idGruppo: 'g1', servizi: [] }];
    const result = pipe.transform(items, 'test', dictionary, 'attivo');
    expect(result.length).toBe(1);
    expect(result[0].servizi.length).toBe(1);
    expect(result[0].servizi[0].idServizio).toBe('api-test');
  });

  it('should match on group name', () => {
    const dictionary: any = {
      'matching-group': [{ idServizio: 'svc', descrizione: 'desc', stato: 'attivo' }]
    };
    const items = [{ idGruppo: 'matching-group', servizi: [] }];
    const result = pipe.transform(items, 'matching', dictionary, '');
    expect(result.length).toBe(1);
  });
});

describe('ServiceFilterPipe', () => {
  let pipe: ServiceFilterPipe;

  beforeEach(() => { pipe = new ServiceFilterPipe(); });

  it('should return items when no value', () => {
    const items = [{ idGruppo: 'g1', nome: 'Test', descrizione: 'desc' }];
    expect(pipe.transform(items, '')).toBe(items);
  });

  it('should return items when null', () => {
    expect(pipe.transform(null as any, 'test')).toBeNull();
  });

  it('should filter by idGruppo', () => {
    const items = [
      { idGruppo: 'api-rest', nome: 'REST', descrizione: 'rest api' },
      { idGruppo: 'api-soap', nome: 'SOAP', descrizione: 'soap api' }
    ];
    expect(pipe.transform(items, 'rest').length).toBe(1);
  });

  it('should filter by nome', () => {
    const items = [
      { idGruppo: 'g1', nome: 'Servizio Anagrafe', descrizione: 'desc' },
      { idGruppo: 'g2', nome: 'Servizio Catasto', descrizione: 'desc' }
    ];
    expect(pipe.transform(items, 'anagrafe').length).toBe(1);
  });

  it('should be case insensitive', () => {
    const items = [{ idGruppo: 'G1', nome: 'TEST', descrizione: 'DESC' }];
    expect(pipe.transform(items, 'test').length).toBe(1);
  });
});

describe('GroupFilterPipe', () => {
  let pipe: GroupFilterPipe;

  beforeEach(() => { pipe = new GroupFilterPipe(); });

  it('should return null items as null', () => {
    expect(pipe.transform(null as any, '')).toBeNull();
  });

  it('should filter by idGruppo', () => {
    const items = [
      { idGruppo: 'alpha', search: ['a'] },
      { idGruppo: 'beta', search: ['b'] }
    ];
    expect(pipe.transform(items, 'alpha').length).toBe(1);
  });

  it('should filter by search array', () => {
    const items = [{ idGruppo: 'g1', search: ['keyword', 'test'] }];
    expect(pipe.transform(items, 'keyword').length).toBe(1);
  });

  it('should apply _all filter for services/domains/subscriptions', () => {
    const items = [
      { idGruppo: 'g1', search: [], isServizio: true, isDominio: false, isAdesione: false },
      { idGruppo: 'g2', search: [], isServizio: false, isDominio: false, isAdesione: false }
    ];
    const result = pipe.transform(items, '', true);
    expect(result.length).toBe(1);
  });
});

describe('DominiFilterListPipe', () => {
  let pipe: DominiFilterListPipe;

  beforeEach(() => { pipe = new DominiFilterListPipe(); });

  it('should return items when no value', () => {
    const items = [{ idGruppo: 'g1', descrizione: 'd', search: [] }];
    expect(pipe.transform(items, '')).toBe(items);
  });

  it('should filter by idGruppo', () => {
    const items = [
      { idGruppo: 'dominio-test', descrizione: 'Test', search: [] },
      { idGruppo: 'dominio-other', descrizione: 'Other', search: [] }
    ];
    expect(pipe.transform(items, 'test').length).toBe(1);
  });

  it('should filter by search array', () => {
    const items = [{ idGruppo: 'g1', descrizione: 'desc', search: ['match-me'] }];
    expect(pipe.transform(items, 'match-me').length).toBe(1);
  });
});

describe('PropertyFilterPipe', () => {
  let pipe: PropertyFilterPipe;

  beforeEach(() => { pipe = new PropertyFilterPipe(); });

  it('should return items when no property', () => {
    const items = [{ nome: 'test' }];
    expect(pipe.transform(items, '', 'test')).toBe(items);
  });

  it('should filter by property value', () => {
    const items = [
      { nome: 'Alpha' },
      { nome: 'Beta' }
    ];
    expect(pipe.transform(items, 'nome', 'alpha').length).toBe(1);
  });
});

describe('RisorseFilterPipe', () => {
  let pipe: RisorseFilterPipe;

  beforeEach(() => { pipe = new RisorseFilterPipe(); });

  it('should return items when no values', () => {
    expect(pipe.transform(['a', 'b'], null as any)).toEqual(['a', 'b']);
  });

  it('should return empty array when items is null', () => {
    expect(pipe.transform(null as any, ['a'])).toEqual([]);
  });

  it('should exclude items present in values', () => {
    expect(pipe.transform(['a', 'b', 'c'], ['b'])).toEqual(['a', 'c']);
  });

  it('should exclude all items when wildcard is present', () => {
    expect(pipe.transform(['a', 'b', 'c'], ['*'])).toEqual([]);
  });

  it('should return all items when values is empty', () => {
    expect(pipe.transform(['a', 'b'], [])).toEqual(['a', 'b']);
  });
});

describe('AuthFilterPipe', () => {
  let pipe: AuthFilterPipe;

  beforeEach(() => { pipe = new AuthFilterPipe(); });

  it('should return items when no values', () => {
    expect(pipe.transform([{ codice_interno: 'a' }], null as any)).toEqual([{ codice_interno: 'a' }]);
  });

  it('should filter out items matching by codice_interno/code', () => {
    const items = [
      { codice_interno: 'mtls', nome: 'mTLS' },
      { codice_interno: 'pdnd', nome: 'PDND' }
    ];
    const values = [{ code: 'mtls' }];
    const result = pipe.transform(items, values);
    expect(result.length).toBe(1);
    expect(result[0].codice_interno).toBe('pdnd');
  });

  it('should return all when no matching codes', () => {
    const items = [{ codice_interno: 'a' }, { codice_interno: 'b' }];
    const values = [{ code: 'c' }];
    expect(pipe.transform(items, values).length).toBe(2);
  });
});
