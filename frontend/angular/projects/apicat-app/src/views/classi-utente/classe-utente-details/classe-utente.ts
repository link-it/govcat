import * as moment from 'moment';

export class ClasseUtente {

  id: number | null = null;
  id_classe_utente: string | null = null;
  descrizione: string | null = null;
  nome: string | null = null;

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
