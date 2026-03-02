import { describe, it, expect } from 'vitest';
import { TipoCertificatoEnum, TipiCertificato } from './certificato.model';

describe('TipoCertificatoEnum', () => {
  it('should have correct values', () => {
    expect(TipoCertificatoEnum.FORNITO).toBe('fornito');
    expect(TipoCertificatoEnum.RICHIESTO_CN).toBe('richiesto_cn');
    expect(TipoCertificatoEnum.RICHIESTO_CSR).toBe('richiesto_csr');
  });
});

describe('TipiCertificato', () => {
  it('should have 3 entries', () => {
    expect(TipiCertificato.length).toBe(3);
  });

  it('should have correct mapping', () => {
    expect(TipiCertificato[0]).toEqual({ nome: 'fornito', value: TipoCertificatoEnum.FORNITO });
    expect(TipiCertificato[1]).toEqual({ nome: 'richiesto_cn', value: TipoCertificatoEnum.RICHIESTO_CN });
    expect(TipiCertificato[2]).toEqual({ nome: 'richiesto_csr', value: TipoCertificatoEnum.RICHIESTO_CSR });
  });
});
