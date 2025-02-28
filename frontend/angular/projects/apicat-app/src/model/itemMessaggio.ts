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
import { ItemUtente } from './itemUtente';
import { AllegatoMessaggio } from './allegatoMessaggio';


export interface ItemMessaggio { 
    data: string;
    id_messaggio?: string;
    autore?: ItemUtente;
    oggetto: string;
    testo?: string;
    allegati?: Array<AllegatoMessaggio>;
}

