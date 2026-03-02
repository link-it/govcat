import { describe, it, expect, beforeEach } from 'vitest';
import { Utente, Ruolo, Stato } from './utente';

describe('Ruolo enum', () => {
  it('should have correct values', () => {
    expect(Ruolo.NESSUN_RUOLO).toBe('nessun_ruolo');
    expect(Ruolo.GESTOERE).toBe('gestore');
    expect(Ruolo.REFERENTE_SERVIZIO).toBe('referente_servizio');
    expect(Ruolo.COORDINATORE).toBe('coordinatore');
  });

  it('should have 4 members', () => {
    const values = Object.values(Ruolo);
    expect(values).toHaveLength(4);
  });
});

describe('Stato enum', () => {
  it('should have correct values', () => {
    expect(Stato.NON_CONFIGURATO).toBe('non_configurato');
    expect(Stato.ABILITATO).toBe('abilitato');
    expect(Stato.DISABILITATO).toBe('disabilitato');
    expect(Stato.PENDING_UPDATE).toBe('pending_update');
  });

  it('should have 4 members', () => {
    const values = Object.values(Stato);
    expect(values).toHaveLength(4);
  });
});

describe('Utente', () => {

  it('should create an instance with default values', () => {
    const model = new Utente();
    expect(model).toBeTruthy();
    expect(model.id).toBeNull();
    expect(model.id_utente).toBeNull();
    expect(model.principal).toBeNull();
    expect(model.nome).toBeNull();
    expect(model.cognome).toBeNull();
    expect(model.telefono).toBeNull();
    expect(model.email).toBeNull();
    expect(model.telefono_aziendale).toBeNull();
    expect(model.email_aziendale).toBeNull();
    expect(model.note).toBeNull();
    expect(model.metadati).toBeNull();
    expect(model.stato).toBeNull();
    expect(model.ruolo).toBeNull();
    expect(model.id_organizzazione).toBeNull();
    expect(model.organizzazione).toBeNull();
    expect(model.organizzazione_pending).toBeNull();
    expect(model.classi_utente).toBeNull();
    expect(model.referente_tecnico).toBe(false);
  });

  it('should assign all properties from data', () => {
    const data = {
      id: 1,
      id_utente: 'user-1',
      principal: 'user@example.com',
      nome: 'Mario',
      cognome: 'Rossi',
      telefono: '+39 333 1234567',
      email: 'mario@example.com',
      telefono_aziendale: '+39 06 9876543',
      email_aziendale: 'mario.rossi@ente.it',
      note: 'Note utente',
      metadati: '{"key":"value"}',
      stato: Stato.ABILITATO,
      ruolo: Ruolo.REFERENTE_SERVIZIO,
      id_organizzazione: 'org-1',
      organizzazione: { id_organizzazione: 'org-1', nome: 'Org Test' },
      organizzazione_pending: { id_organizzazione: 'org-2', nome: 'Org Pending' },
      classi_utente: { id_classe_utente: 'cls-1', nome: 'Admin' },
      referente_tecnico: true
    };
    const model = new Utente(data);
    expect(model.id).toBe(1);
    expect(model.id_utente).toBe('user-1');
    expect(model.principal).toBe('user@example.com');
    expect(model.nome).toBe('Mario');
    expect(model.cognome).toBe('Rossi');
    expect(model.telefono).toBe('+39 333 1234567');
    expect(model.email).toBe('mario@example.com');
    expect(model.telefono_aziendale).toBe('+39 06 9876543');
    expect(model.email_aziendale).toBe('mario.rossi@ente.it');
    expect(model.note).toBe('Note utente');
    expect(model.metadati).toBe('{"key":"value"}');
    expect(model.stato).toBe(Stato.ABILITATO);
    expect(model.ruolo).toBe(Ruolo.REFERENTE_SERVIZIO);
    expect(model.id_organizzazione).toBe('org-1');
    expect(model.organizzazione).toEqual({ id_organizzazione: 'org-1', nome: 'Org Test' });
    expect(model.organizzazione_pending).toEqual({ id_organizzazione: 'org-2', nome: 'Org Pending' });
    expect(model.classi_utente).toEqual({ id_classe_utente: 'cls-1', nome: 'Admin' });
    expect(model.referente_tecnico).toBe(true);
  });

  it('should accept enum values as strings', () => {
    const data = { stato: 'abilitato', ruolo: 'gestore' };
    const model = new Utente(data);
    expect(model.stato).toBe('abilitato');
    expect(model.ruolo).toBe('gestore');
  });

  it('should ignore null values in data (keeps default null)', () => {
    const data = { nome: null, cognome: 'Bianchi' };
    const model = new Utente(data);
    expect(model.nome).toBeNull();
    expect(model.cognome).toBe('Bianchi');
  });

  it('should ignore undefined values in data', () => {
    const data = { nome: undefined, id: 5 };
    const model = new Utente(data);
    expect(model.nome).toBeNull();
    expect(model.id).toBe(5);
  });

  it('should ignore extra properties not defined on the class', () => {
    const data = { nome: 'Test', extraField: 'extra' };
    const model = new Utente(data);
    expect(model.nome).toBe('Test');
    expect((model as any).extraField).toBeUndefined();
  });

  it('should handle empty data object', () => {
    const model = new Utente({});
    expect(model.id).toBeNull();
    expect(model.referente_tecnico).toBe(false);
  });

  it('should handle partial data and keep remaining defaults', () => {
    const data = { id: 10, nome: 'Luca', referente_tecnico: true };
    const model = new Utente(data);
    expect(model.id).toBe(10);
    expect(model.nome).toBe('Luca');
    expect(model.referente_tecnico).toBe(true);
    expect(model.cognome).toBeNull();
    expect(model.stato).toBeNull();
  });
});
