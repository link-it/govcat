import * as moment from 'moment';

export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}

export enum TipoGateway {
  APIGateway = 'APIGateway',
  ModIPA = 'ModIPA',
  SPCoop = 'SPCoop',
  FatturaPA = 'FatturaPA',
  eDelivery = 'eDelivery'
}

export class Soggetto {

  id: number | null = null;
  id_soggetto: string | null = null;
  aderente: boolean = false;
  nome: string | null = null;
  referente: boolean = false;
  organizzazione: Organizzazione | null = null;
  
  descrizione: string | null = null;
  codice_ente: string | null = null;
  codice_fiscale_soggetto: string | null = null;
  id_tipo_utente: string | null = null;
  
  id_organizzazione: string | null = null;
  
  vincola_aderente: boolean = false;
  vincola_referente: boolean = false;

  nome_gateway: string | null = null;
  tipo_gateway: TipoGateway | null = null;

  url_invocazione: string | null = null;
  url_prefix_collaudo: string | null = null;
  url_prefix_produzione: string | null = null;

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
