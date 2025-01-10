import * as moment from 'moment';

interface Soggetto {
  id_soggetto: number | null;
  nome: string | null;
  aderente: boolean;
  referente: boolean;
}

export class Organizzazione {

  id_organizzazione: number | null = null;
  nome: string | null = null;
  descrizione: string | null = null;
  codice_ente: string | null = null;
  codice_fiscale_soggetto: string | null = null;
  id_tipo_utente: string | null = null;
  referente: boolean = false;
  aderente: boolean = false;
  esterna: boolean = false;
  cambio_esterna_consentito: boolean = false;

  vincola_aderente: boolean = false;
  vincola_referente: boolean = false;

  id_soggetto_default: string | null = null;

  soggetto_default: Soggetto | null = null;

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
