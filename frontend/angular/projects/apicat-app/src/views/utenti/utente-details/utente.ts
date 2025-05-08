export interface ClassiUtente {
  id_classe_utente: string | null;
  nome: string | null;
}

export interface Organizzazione {
  id_organizzazione: string | null;
  // descrizione: string | null;
  nome: string | null;
}

export enum Ruolo {
  NESSUN_RUOLO = 'nessun_ruolo',
  GESTOERE = 'gestore',
  REFERENTE_SERVIZIO = 'referente_servizio',
  COORDINATORE = 'coordinatore'
}

export enum Stato {
  NON_CONFIGURATO = 'non_configurato',
  ABILITATO = 'abilitato',
  DISABILITATO = 'disabilitato'
}

export class Utente {

  id: number | null = null;
  id_utente: string | null = null;
  principal: string | null = null;
  nome: string | null = null;
  cognome: string | null = null;
  telefono: string | null = null;
  email: string | null = null;
  telefono_aziendale: string | null = null;
  email_aziendale: string | null = null;
  note: string | null = null;
  metadati: string | null = null;
  stato: Stato | null = null;
  ruolo: Ruolo | null = null;
  id_organizzazione: string | null = null;
  // classi_utente: Array<any> = [];
  organizzazione: Organizzazione | null = null;
  classi_utente: ClassiUtente | null = null;
  referente_tecnico: boolean = false;

  constructor(_data?: any) {
    if (_data) {
      for (const key in _data) {
        if (this.hasOwnProperty(key)) {
          if (_data[key] !== null && _data[key] !== undefined) {
            switch (key) {
              default:
                (this as any)[key] = _data[key];
            }
          }
        }
      }
    }
  }
}
