export interface DominioCreateUpdateRequest {
    nome: string;
    visibilita: string;
    classi?: Classi[];
    id_soggetto_referente: string;
    soggetto_referente?: Soggettoreferente;
    id_dominio?: string;
    descrizione?: string;
    tag?: string;
    deprecato: boolean;
    url_invocazione?: string;
    url_prefix_collaudo?: string;
    url_prefix_produzione?: string;
}

export interface Classi {
    id_classe_utente: string;
    nome: string;
    descrizione: string;
}

export interface Soggettoreferente {
    id_soggetto: string;
    nome: string;
    descrizione: string;
    organizzazione: Organizzazione;
    referente: boolean;
    aderente: boolean;
    nome_gateway: string;
    tipo_gateway: string;
    url_invocazione?: string;
    url_prefix_collaudo?: string;
    url_prefix_produzione?: string;
}

export interface Organizzazione {
    id_organizzazione: string;
    nome: string;
    descrizione: string;
    codice_ente: string;
    codice_fiscale_soggetto: string;
    id_tipo_utente: string;
    soggetto_default: Soggettodefault;
    referente: boolean;
    aderente: boolean;
    multi_soggetto: boolean;
    esterna: boolean;
}

export interface Soggettodefault {
    id_soggetto: string;
    nome: string;
    descrizione: string;
    referente: boolean;
    aderente: boolean;
    nome_gateway: string;
    tipo_gateway: string;
}

