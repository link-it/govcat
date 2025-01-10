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


/**
 * I tipi di autenticazione supportati da una componente
 */
export type ComponentAuthTypeEnum = 'http_basic' | 'https' | 'https_sign' | 'https_pdnd' | 'https_pdnd_sign' | 'oauth_client_credentials' | 'oauth_authorization_code' | 'indirizzo_ip' | 'no_dati';

export const ComponentAuthTypeEnum = {
    HttpBasic: 'http_basic' as ComponentAuthTypeEnum,
    Https: 'https' as ComponentAuthTypeEnum,
    HttpsSign: 'https_sign' as ComponentAuthTypeEnum,
    HttpsPdnd: 'https_pdnd' as ComponentAuthTypeEnum,
    HttpsPdndSign: 'https_pdnd_sign' as ComponentAuthTypeEnum,
    OauthClientCredentials: 'oauth_client_credentials' as ComponentAuthTypeEnum,
    OauthAuthorizationCode: 'oauth_authorization_code' as ComponentAuthTypeEnum,
    IndirizzoIp: 'indirizzo_ip' as ComponentAuthTypeEnum,
    NoDati: 'no_dati' as ComponentAuthTypeEnum
};

