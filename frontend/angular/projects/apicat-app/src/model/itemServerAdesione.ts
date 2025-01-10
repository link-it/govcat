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
import { AdesioneServerUpdateCertificatoServer } from './adesioneServerUpdateCertificatoServer';


export interface ItemServerAdesione { 
    url: string;
    indirizzi_ip?: string;
    certificato_server?: AdesioneServerUpdateCertificatoServer;
    server_id?: string;
    nome?: string;
    versione?: number;
}

