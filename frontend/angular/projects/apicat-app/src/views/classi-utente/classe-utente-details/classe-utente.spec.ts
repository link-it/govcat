import { describe, it, expect } from 'vitest';
import { ClasseUtente } from './classe-utente';

describe('ClasseUtente', () => {
  it('should create with defaults', () => {
    const c = new ClasseUtente();
    expect(c.id).toBeNull();
    expect(c.id_classe_utente).toBeNull();
    expect(c.descrizione).toBeNull();
    expect(c.nome).toBeNull();
  });

  it('should assign data from constructor', () => {
    const c = new ClasseUtente({
      id: 1,
      id_classe_utente: 'cu-1',
      nome: 'Classe A',
      descrizione: 'Desc',
    });
    expect(c.id).toBe(1);
    expect(c.id_classe_utente).toBe('cu-1');
    expect(c.nome).toBe('Classe A');
    expect(c.descrizione).toBe('Desc');
  });

  it('should ignore null and undefined values', () => {
    const c = new ClasseUtente({ nome: null, descrizione: undefined });
    expect(c.nome).toBeNull();
    expect(c.descrizione).toBeNull();
  });

  it('should ignore unknown keys', () => {
    const c = new ClasseUtente({ foo: 'bar' });
    expect((c as any).foo).toBeUndefined();
  });
});
