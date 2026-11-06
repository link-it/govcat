import { describe, it, expect } from 'vitest';
import { erogatoreFruizione, soggettoMonitoraggio, tipoMonitoraggio } from './monitoraggio-soggetti';

describe('monitoraggio-soggetti (Issue #424)', () => {
  const erogazione = { dominio: { soggetto_referente: { nome: 'Ente' } } };
  const fruizione = { fruizione: true, soggetto_erogatore: { nome: 'MinisteroInterno' }, dominio: { soggetto_referente: { nome: 'Regione' } } };

  it('should use the erogations only for the APIs of the domain subject of a non fruition service', () => {
    expect(tipoMonitoraggio({ ruolo: 'erogato_soggetto_dominio' }, erogazione)).toBe('erogazioni');
    expect(tipoMonitoraggio({ ruolo: 'erogato_soggetto_dominio' }, fruizione)).toBe('fruizioni');
    expect(tipoMonitoraggio({ ruolo: 'erogato_soggetto_aderente' }, erogazione)).toBe('fruizioni');
  });

  it('should put the internal subject in the path, not the remote provider of the fruition', () => {
    expect(soggettoMonitoraggio(fruizione)).toBe('Regione');
    expect(soggettoMonitoraggio(erogazione)).toBe('Ente');
    expect(soggettoMonitoraggio(null)).toBe('');
  });

  it('should give the remote provider only for a fruition', () => {
    expect(erogatoreFruizione(fruizione)).toBe('MinisteroInterno');
    expect(erogatoreFruizione({ ...erogazione, soggetto_erogatore: { nome: 'X' } })).toBe('');
  });
});
