/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2025 Link.it srl (https://link.it).
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3, as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */
package org.govway.catalogo.assembler;

import org.govway.catalogo.core.orm.entity.ProfiloEntity.AuthType;
import org.govway.catalogo.core.orm.entity.ProfiloEntity.ConfigurazioneCompatibilitaApi;
import org.govway.catalogo.core.orm.entity.ProfiloEntity.ConfigurazioneTipoDominio;
import org.govway.catalogo.servlets.model.AuthTypeEnum;
import org.govway.catalogo.servlets.model.ConfigurazioneCompatibilitaApiEnum;
import org.govway.catalogo.servlets.model.ConfigurazioneTipoDominioEnum;


public class ProfiloEngineAssembler extends CoreEngineAssembler {

    public AuthType toEntity(AuthTypeEnum authTypeEnum) {
        switch(authTypeEnum) {
            case HTTPS: return AuthType.HTTPS;
            case PDND: return AuthType.PDND;
            case HTTPS_PDND: return AuthType.HTTPS_PDND;
            case SIGN: return AuthType.SIGN;
            case SIGN_PDND: return AuthType.SIGN_PDND;
            case HTTP_BASIC: return AuthType.HTTP_BASIC;
            case HTTPS_SIGN: return AuthType.HTTPS_SIGN;
            case HTTPS_PDND_SIGN: return  AuthType.HTTPS_PDND_SIGN;
            case OAUTH_AUTHORIZATION_CODE: return AuthType.OAUTH_AUTHORIZATION_CODE;
            case OAUTH_CLIENT_CREDENTIALS: return AuthType.OAUTH_CLIENT_CREDENTIALS;
            case INDIRIZZO_IP: return AuthType.INDIRIZZO_IP;
            case NO_DATI: return AuthType.NO_DATI;
        }
        return null;
    }

    public AuthTypeEnum toAuthTypeEnum(AuthType authType) {
        switch(authType) {
            case HTTPS: return AuthTypeEnum.HTTPS;
            case PDND: return AuthTypeEnum.PDND;
            case HTTPS_PDND: return AuthTypeEnum.HTTPS_PDND;
            case SIGN: return AuthTypeEnum.SIGN;
            case SIGN_PDND: return AuthTypeEnum.SIGN_PDND;
            case HTTP_BASIC: return AuthTypeEnum.HTTP_BASIC;
            case HTTPS_SIGN: return AuthTypeEnum.HTTPS_SIGN;
            case HTTPS_PDND_SIGN: return  AuthTypeEnum.HTTPS_PDND_SIGN;
            case OAUTH_AUTHORIZATION_CODE: return AuthTypeEnum.OAUTH_AUTHORIZATION_CODE;
            case OAUTH_CLIENT_CREDENTIALS: return AuthTypeEnum.OAUTH_CLIENT_CREDENTIALS;
            case INDIRIZZO_IP: return AuthTypeEnum.INDIRIZZO_IP;
            case NO_DATI: return AuthTypeEnum.NO_DATI;
        }
        return null;
    }

    public ConfigurazioneCompatibilitaApi toEntity(ConfigurazioneCompatibilitaApiEnum configurazioneCompatibilitaApiEnum) {
        switch(configurazioneCompatibilitaApiEnum) {
            case REST: return ConfigurazioneCompatibilitaApi.REST;
            case SOAP: return ConfigurazioneCompatibilitaApi.SOAP;
        }
        return null;
    }

    public ConfigurazioneCompatibilitaApiEnum toConfigurazioneCompatibilitaApiEnum(ConfigurazioneCompatibilitaApi configurazioneCompatibilitaApi) {
        switch(configurazioneCompatibilitaApi) {
            case REST: return ConfigurazioneCompatibilitaApiEnum.REST;
            case SOAP: return ConfigurazioneCompatibilitaApiEnum.SOAP;
        }
        return null;
    }

    public ConfigurazioneTipoDominio toEntity(ConfigurazioneTipoDominioEnum configurazioneTipoDominioEnum) {
        switch(configurazioneTipoDominioEnum) {
            case ESTERNO: return ConfigurazioneTipoDominio.ESTERNO;
            case INTERNO: return ConfigurazioneTipoDominio.INTERNO;
        }
        return null;
    }

    public ConfigurazioneTipoDominioEnum toConfigurazioneTipoDominioEnum(ConfigurazioneTipoDominio configurazioneTipoDominio) {
        switch(configurazioneTipoDominio) {
            case ESTERNO: return ConfigurazioneTipoDominioEnum.ESTERNO;
            case INTERNO: return ConfigurazioneTipoDominioEnum.INTERNO;
        }
        return null;
    }
}
