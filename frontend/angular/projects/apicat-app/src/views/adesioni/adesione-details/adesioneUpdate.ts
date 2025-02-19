import { ReferenteCreate } from '@app/model/referenteCreate';
import { VisibilitaEnum } from '@app/model/visibilitaEnum';


export interface Servizio {
    "id_servizio": string | null;
    "nome": string | null;
    "versione": string | null;
    "descrizione": string | null;
    "descrizione_sintetica": string | null;
    "visibilita": string | null;
    "stato": string | null;
    "multi_adesione": boolean;
    "id_dominio": string | null;
}


export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}

export interface Soggetto {
  aderente: boolean;
  id_soggetto: string | null;
  nome: string | null;
  organizzazione: Organizzazione;
  referente: boolean;
}


export class AdesioneUpdate {
  id_logico: string | null = null;
  referenti: Array<ReferenteCreate> = [];
  
  visibilita: VisibilitaEnum | null = null;

  referente: string = '';
  referente_tecnico: string = '';

  // servizio: string | null = null;
  servizio: Servizio | null = null;
  id_servizio: string | null = null;

  // soggetto: string | null = null;
  soggetto: Soggetto | null = null;
  id_soggetto: string | null = null;

  organizzazione: string | null = null;
  id_organizzazione: string | null = null;

  servizio_nome: string | null = null;
  soggetto_nome: string | null = null;

  data_creazione: string = '';
  data_ultimo_aggiornamento: string = '';


  // ----da adesione.ts-------
  id_adesione: string | null = null;
  stato: string = '';
  organizzazione_nome: string | null = null;
  // -------------------------

  skip_collaudo: boolean = false;

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
