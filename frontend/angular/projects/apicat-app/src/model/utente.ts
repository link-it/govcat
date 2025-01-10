/**
 * MODI - APICatalogo
 * Registrazione e Adesione alle API
 *
 * The version of the OpenAPI document: 1.5.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */
import { Organizzazione } from './organizzazione';
import { RuoloUtenteEnum } from './ruoloUtenteEnum';
import { StatoUtenteEnum } from './statoUtenteEnum';


export interface Utente { 
    id_utente: string;
    nome: string;
    cognome: string;
    telefono?: string;
    email?: string;
    telefono_aziendale: string;
    email_aziendale: string;
    note?: string;
    metadati?: string;
    stato: StatoUtenteEnum;
    ruolo?: RuoloUtenteEnum;
    organizzazione?: Organizzazione;
    classi_utente?: Array<string>;
}
export namespace Utente {
}


