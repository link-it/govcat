import * as moment from 'moment';

export interface Identificativo {
  nome: string | null;
  versione: string | null;
  dominio: string | null;
  id_dominio: string | null;
  visibilita: string | null;
  multi_adesione: boolean;
}

export interface DatiGenerici {
  gruppo: string | null;
  descrizione: string | null;
  descrizione_sintetica: string | null;
  termini_ricerca: string | null;
  note: string | null;
  tags: string[];
  tassonomie: any[];
  allegati: any[];
}

export interface DatiGenerici {
  allegati: any[];
}

export class Transazione {

  id_transazione: number | null = null;
  
  nome: string | null = null;
  versione: string | null = null;
  dominio: string | null = null;
  visibilita: string | null = null;
  multi_adesione: boolean = false;

  gruppo: string | null = null;
  descrizione: string | null = null;
  descrizione_sintetica: string | null = null;
  termini_ricerca: string | null = null;
  note: string | null = null;
  tags: string[] = [];
  tassonomie: any[] = [];
  allegati: any[] = [];

  stato: string = 'bozza';
  
  utente_richiedente: string = '';
  data_creazione: string = '';
  data_ultima_modifica: string = '';
  utente_ultima_modifica: string = '';

  immagine: any = null;

  label: string | null = null;
  classi: any[] = [];

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
