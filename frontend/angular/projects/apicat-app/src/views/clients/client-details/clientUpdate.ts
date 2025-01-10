
export interface CommonName {
  tipo_certificato: string | null;
  cn: string | null;
  certificato?: Certificato;
}


export interface DoubleCert {
  tipo_certificato: string | null;
  richiesta: Certificato;
  modulo_richiesta: Certificato;
  certificato?: Certificato;
}

export interface Certificato {
  tipo_documento: string | null;
  content_type?: string | null;
  content?: string | null;
  filename?: string | null;
  uuid?: string | null;
}

export interface DatiSpecItem {
  tipo_certificato: string | null;
  certificato: Certificato
}

export interface RateLimiting {
  quota: number | null;
  periodo: string | null;
}

export interface Datispecifici {
  auth_type: string | null;

  richiesta?: Certificato | null;
  modulo_richiesta?: Certificato | null;

  certificato_autenticazione?: CommonName | DatiSpecItem | DoubleCert | null;
  certificato_firma?: CommonName | DatiSpecItem | DoubleCert | null;

  url_redirezione?: string | null;
  url_esposizione?: string | null;
  help_desk?: string | null;
  nome_applicazione_portale?: string | null;

  username?: string | null;
  client_id?: string | null;

  rate_limiting?: RateLimiting | null;
  finalita?: string | null;
}


export class ClientUpdate { 
  
  dati_specifici: Datispecifici | null = null;

  ambiente: string | null = null;
  id_soggetto: string | null = null;
  nome: string | null = null;

  indirizzi_ip?: string | null = null;
  descrizione?: string | null = null;

  rate_limiting?: RateLimiting | null;
  finalita?: string | null;

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

