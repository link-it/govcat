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
import { ProtocolloEnum } from './protocolloEnum';
import { RuoloAPIEnum } from './ruoloAPIEnum';


export interface IdentificativoApiUpdate { 
    nome: string;
    versione: number;
    ruolo: RuoloAPIEnum;
    protocollo: ProtocolloEnum;
    profilo: object;
}
export namespace IdentificativoApiUpdate {
}


