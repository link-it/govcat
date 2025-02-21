import * as moment from 'moment';

import { TipoGateway } from './soggetto';

export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}

export class SoggettoCreate {

  id_soggetto: string | null = '';
  aderente: boolean = false;
  referente: boolean = false;
  nome: string | null = '';
  id_organizzazione: string | null = '';
  organizzazione: Organizzazione | null = {id_organizzazione: '', nome: ''};

  descrizione: string | null = '';
  // codice_ente: string | null = null;
  // codice_fiscale_soggetto: string | null = null;
  // id_tipo_utente: string | null = null;

  nome_gateway: string | null = null;
  tipo_gateway: TipoGateway | null = null;

  url_invocazione: string | null = null;
  url_prefix_collaudo: string | null = null;
  url_prefix_produzione: string | null = null;

  skip_collaudo: boolean = false;
  vincola_skip_collaudo: boolean = false;

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
