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
import { ConfigurazioneAdesione } from './configurazioneAdesione';
import { ConfigurazioneSoggetto } from './configurazioneSoggetto';
import { ConfigurazioneGruppo } from './configurazioneGruppo';
import { ConfigurazioneUtente } from './configurazioneUtente';
import { ConfigurazioneServizio } from './configurazioneServizio';
import { ConfigurazioneDominio } from './configurazioneDominio';


export interface Configurazione { 
    soggetto: ConfigurazioneSoggetto;
    dominio: ConfigurazioneDominio;
    gruppo: ConfigurazioneGruppo;
    utente: ConfigurazioneUtente;
    servizio?: ConfigurazioneServizio;
    adesione?: ConfigurazioneAdesione;
}

