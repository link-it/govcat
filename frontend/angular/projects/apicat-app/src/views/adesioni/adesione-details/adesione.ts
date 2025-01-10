import * as moment from 'moment';


// export interface Soggetto {
//   aderente: boolean;
//   id_soggetto: string | null;
//   nome: string | null;
//   organizzazione: Organizzazione;

// }

// export interface Organizzazione {
//   id_organizzazione: string | null;
//   nome: string | null;
// }



export class Adesione {

  id: number | null = null;
  id_adesione: string | null = null;
  id_logico: string | null = null;

  data_creazione: string = '';
  data_ultimo_aggiornamento: string = '';
  
  // status: string = '';
  stato: string = 'bozza';

  servizio: string | null = null;
  id_servizio: string | null = null;

  soggetto: string | null = null;
  id_soggetto: string | null = null;

  organizzazione: string | null = null;
  // organizzazione?: Organizzazione;
  id_organizzazione: string | null = null;

  servizio_nome: string | null = null;
  soggetto_nome: string | null = null;
  organizzazione_nome: string | null = null;


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
