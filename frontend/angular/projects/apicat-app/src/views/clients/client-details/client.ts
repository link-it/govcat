
export interface TipoCertificatoEnum {
  fornito: string | null;
  richiesto_cn: string | null;
  richiesto_csr: string | null;
}

export interface Certificato {
  cn?: string | null;
  tipo_certificato: string | null;
  richiesta?: Richiesta | null;
  modulo_richiesta?: Modulo_richiesta | null;
  certificato?: {
    filename: string | null;
    uuid: string | null;
    content: string | null;
    content_type: string | null;
  } | null;
}

export interface Richiesta {
  filename: string | null;
  uuid: string | null;
  content?: string | null;
  content_type: string | null;
} 

export interface Modulo_richiesta {
  filename: string | null;
  uuid: string | null;
  content?: string | null;
  content_type: string | null;
}

export interface Organizzazione {
  id_organizzazione: string | null;
  nome: string | null;
}

export interface Soggetto {
  id_soggetto: string | null;
  nome: string | null;
  aderente: boolean;
  organizzazione: Organizzazione | null;
  referente?: boolean;
}

export interface DatiSpecifici_old {
  auth_type: string | null;
  certificato: Certificato | null;
}

export enum PeriodEnum {
  Giorno = "giorno",
  Ora = "ora",
  Minuti = "minuti"
}

export interface RateLimiting {
  quota: number | null;
  periodo: PeriodEnum | null;
}

export class Client {

  id_client: string | null = null;
  nome: string | null = null;
  auth_type: string | null = null;
  stato: string | null = null;
  descrizione: string | null = null;
  ambiente: string | null = null;
  cn: string | null = null;
  cn_firma: string | null = null;
  tipo_certificato: Array<any> = [];
  tipo_certificato_firma: Array<any> = [];
  ip_fruizione: string | null = null;
  indirizzo_ip: string | null = null;
  utilizzato_in_adesioni_configurate: boolean = false;

  csr_richiesta_filename: string | null = null;
  csr_richiesta_content: string | null = null;
  csr_richiesta_content_type: string | null = null;
  csr_richiesta_uuid: string | null = null;

  csr_modulo_ric_filename: string | null = null;
  csr_modulo_ric_content: string | null = null;
  csr_modulo_ric_content_type: string | null = null;
  csr_modulo_ric_uuid: string | null = null;

  cert_generato_filename: string | null = null;
  cert_generato_content: string | null = null;
  cert_generato_content_type: string | null = null;
  cert_generato_uuid: string | null = null;

  cert_fornito_filename: string | null = null;
  cert_fornito_content: string | null = null;
  cert_fornito_content_type: string | null = null;
  cert_fornito_uuid: string | null = null;

  cert_generato_filename_firma: string | null = null;
  cert_generato_content_firma: string | null = null;
  cert_generato_content_type_firma: string | null = null;
  cert_generato_uuid_firma: string | null = null;

  cert_fornito_filename_firma: string | null = null;
  cert_fornito_content_firma: string | null = null;
  cert_fornito_content_type_firma: string | null = null;
  cert_fornito_uuid_firma: string | null = null;

  csr_modulo_ric_filename_firma: string | null = null;
  csr_modulo_ric_content_firma: string | null = null;
  csr_modulo_ric_content_type_firma: string | null = null;
  csr_modulo_ric_uuid_firma: string | null = null;

  csr_richiesta_filename_firma: string | null = null;
  csr_richiesta_content_firma: string | null = null;
  csr_richiesta_content_type_firma: string | null = null;
  csr_richiesta_uuid_firma: string | null = null;

  cert_generato_csr_filename: string | null = null;
  cert_generato_csr_content: string | null = null;
  cert_generato_csr_content_type: string | null = null;
  cert_generato_csr_uuid: string | null = null;

  cert_generato_csr_filename_firma: string | null = null;
  cert_generato_csr_content_firma: string | null = null;
  cert_generato_csr_content_type_firma: string | null = null;
  cert_generato_csr_uuid_firma: string | null = null;

  dati_specifici: DatiSpecifici_old | null = null;

  client_id: string | null = null;

  soggetto: Soggetto | null = null;
  id_soggetto: string | null = null;

  organizzazione: string | null = null;
  id_organizzazione: string | null = null;

  username: string | null = null;

  url_redirezione: string | null = null;
  url_esposizione: string | null = null;
  help_desk: string | null = null;
  nome_applicazione_portale: string | null = null;

  rate_limiting: RateLimiting | null = null;
  finalita: string | null = null;

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
