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
import { Documento } from './documento';
import { VisibilitaEnum } from './visibilitaEnum';


export interface ItemServizio { 
    id_servizio: string;
    nome: string;
    versione: string;
    descrizione: string;
    descrizione_sintetica: string;
    immagine?: Documento;
    visibilita: VisibilitaEnum;
    stato: string;
    id_dominio?: string;
    id_gruppo?: string;
}
export namespace ItemServizio {
}


