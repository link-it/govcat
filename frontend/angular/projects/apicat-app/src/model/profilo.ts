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
import { Idm } from './idm';
import { StatoProfiloEnum } from './statoProfiloEnum';
import { Utente } from './utente';


export interface Profilo { 
    utente: Utente;
    stato?: StatoProfiloEnum;
    idm?: Idm;
}
export namespace Profilo {
}


