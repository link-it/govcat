import { describe, it, expect } from 'vitest';
import {
  apiConAudit, apiConAuditInAmbienti, auditAbilitato, auditDettaglio, erroreAudit, formattaDataAudit, pathConAudit, richiedenteConAudit
} from './audit';

describe('audit (Issue #404)', () => {
  const proprieta = [
    { nome_gruppo: 'PDNDCollaudo', nome_proprieta: 'audit', ambiente: 'collaudo' },
    { nome_gruppo: 'PDNDProduzione', nome_proprieta: 'audit', ambiente: 'produzione' }
  ];
  const api = (gruppo: string, valore: any, nome: string = 'audit') => ({ proprieta_custom: [{ gruppo, proprieta: [{ nome: 'altra', valore: 'x' }, { nome, valore }] }] });

  it('should require monitoring and audit enabled', () => {
    expect(auditAbilitato({ abilitato: true, audit_abilitato: true })).toBe(true);
    expect(auditAbilitato({ abilitato: true })).toBe(false);
    expect(auditAbilitato({ abilitato: false, audit_abilitato: true })).toBe(false);
    expect(auditAbilitato(null)).toBe(false);
  });

  it('should find the audit property of the environment with a value', () => {
    expect(apiConAudit(api('PDNDCollaudo', 'AUDIT_REST_02'), 'collaudo', proprieta)).toBe(true);
    expect(apiConAudit(api('PDNDCollaudo', 'AUDIT_REST_02'), 'produzione', proprieta)).toBe(false);
    expect(apiConAudit(api('PDNDCollaudo', '  '), 'collaudo', proprieta)).toBe(false);
    expect(apiConAudit(api('PDNDCollaudo', 'AUDIT_REST_02', 'altro'), 'collaudo', proprieta)).toBe(false);
    expect(apiConAudit(api('Altro', 'AUDIT_REST_02'), 'collaudo', proprieta)).toBe(false);
    expect(apiConAudit({}, 'collaudo', proprieta)).toBe(false);
    expect(apiConAudit(api('PDNDCollaudo', 'AUDIT_REST_02'), 'collaudo', null)).toBe(false);
  });

  it('should find the audit in any configured environment', () => {
    expect(apiConAuditInAmbienti(api('PDNDProduzione', 'AUDIT_REST_01'), proprieta)).toBe(true);
    expect(apiConAuditInAmbienti(api('PDNDProduzione', ''), proprieta)).toBe(false);
  });

  it('should add the audit parameter once', () => {
    expect(pathConAudit('collaudo/diagnostica/lista-transazioni-id')).toBe('collaudo/diagnostica/lista-transazioni-id?includi_audit=true');
    expect(pathConAudit('lista-transazioni?page=1&size=20')).toBe('lista-transazioni?page=1&size=20&includi_audit=true');
    expect(pathConAudit('lista-transazioni?page=1&includi_audit=true')).toBe('lista-transazioni?page=1&includi_audit=true');
  });

  it('should format the dates without time zone conversions, keeping other formats', () => {
    expect(formattaDataAudit('2026-10-26T09:13:19.000')).toBe('26-10-2026 09:13:19');
    expect(formattaDataAudit('2026-10-26T23:59:00')).toBe('26-10-2026 23:59:00');
    expect(formattaDataAudit('1761469999')).toBe('1761469999');
    expect(formattaDataAudit('')).toBeNull();
    expect(formattaDataAudit(undefined)).toBeNull();
  });

  it('should prepare the detail with formatted dates and named properties', () => {
    expect(auditDettaglio(null)).toBeNull();
    expect(auditDettaglio({ kid: 'k1', issued_at: '2026-10-26T09:13:19.000', altre_proprieta: [{ nome: 'custom', valore: 'v' }, { valore: 'senza nome' }] }))
      .toEqual({ kid: 'k1', issued_at: '26-10-2026 09:13:19', not_before: null, expiration: null, altre_proprieta: [{ nome: 'custom', valore: 'v' }] });
  });

  it('should show the audit user in place of the anonymous requester or after the requester', () => {
    expect(richiedenteConAudit({ audit: { user_id: 'U1' } })).toEqual({ richiedente_anonimo: null, utente_audit: 'U1', richiedente_utente_audit: null });
    expect(richiedenteConAudit({ richiedente: 'Ente', audit: { user_id: 'U1' } })).toEqual({ richiedente_anonimo: null, utente_audit: null, richiedente_utente_audit: '(U1)' });
    expect(richiedenteConAudit({ audit: { pattern: 'AUDIT_REST_01' } })).toEqual({ richiedente_anonimo: '?', utente_audit: null, richiedente_utente_audit: null });
    expect(richiedenteConAudit({ richiedente: 'Ente' })).toEqual({ richiedente_anonimo: null, utente_audit: null, richiedente_utente_audit: null });
  });

  it('should recognize the audit errors of the backend', () => {
    expect(erroreAudit({ error: { detail: 'MON.400.AUDIT.API' } })).toBe(true);
    expect(erroreAudit({ error: { detail: 'MON.404.AUDIT' } })).toBe(true);
    expect(erroreAudit({ error: { detail: 'SYS.500' } })).toBe(false);
    expect(erroreAudit(null)).toBe(false);
  });
});
