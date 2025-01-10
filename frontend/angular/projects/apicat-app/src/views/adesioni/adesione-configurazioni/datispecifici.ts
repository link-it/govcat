
export interface CommonName {
    tipo_certificato: string | null;
    cn: string | null;
}


export interface DoubleCert {
    tipo_certificato: string | null;
    richiesta: Certificato;
    modulo_richiesta: Certificato;
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

export enum PeriodEnum {
    Giorno = "giorno",
    Ora = "ora",
    Minuti = "minuti"
}

export interface RateLimiting {
    quota: number | null;
    periodo: PeriodEnum | null;
}

export class Datispecifici {

    auth_type: string | null = null;

    richiesta?: Certificato | null;
    modulo_richiesta?: Certificato | null;

    certificato_autenticazione?: CommonName | DatiSpecItem | DoubleCert | null;
    certificato_firma?: CommonName | DatiSpecItem | DoubleCert | null;

    url_redirezione?: string | null = null;
    url_esposizione?: string | null = null;
    help_desk?: string | null = null;
    nome_applicazione_portale?: string | null = null;

    username?: string | null = null;
    client_id?: string | null = null;
    
    rate_limiting?: RateLimiting | null = null;
    finalita?: string | null = null;

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
