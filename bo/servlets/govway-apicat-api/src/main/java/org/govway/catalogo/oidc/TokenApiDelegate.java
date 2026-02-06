/*
 * GovCat - GovWay API Catalogue
 * https://github.com/link-it/govcat
 *
 * Copyright (c) 2021-2026 Link.it srl (https://link.it).
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
package org.govway.catalogo.oidc;

import org.govway.catalogo.servlets.oidc.model.TokenResponse;
import org.springframework.http.ResponseEntity;

/**
 * Interfaccia delegate per le operazioni OIDC Token.
 *
 * Questa interfaccia è separata da TokenApi (generata da OpenAPI) per evitare
 * conflitti con le annotazioni @RequestMapping presenti nell'interfaccia generata.
 *
 * Per abilitare la funzionalità OIDC, configurare oidc.service_class con una classe
 * che implementa questa interfaccia.
 */
public interface TokenApiDelegate {

    /**
     * Emette o rinnova un access token.
     */
    ResponseEntity<TokenResponse> token(
            String grantType,
            String clientId,
            String clientSecret,
            String code,
            String redirectUri,
            String refreshToken,
            String scope,
            String clientAssertionType,
            String clientAssertion,
            String codeVerifier);

    /**
     * Revoca un access token o refresh token.
     */
    ResponseEntity<Void> revoke(
            String token,
            String tokenTypeHint,
            String clientId,
            String clientSecret,
            String clientAssertionType,
            String clientAssertion);

    /**
     * Termina la sessione utente e restituisce la URI di redirect per il logout.
     */
    ResponseEntity<Void> logout(
            String idTokenHint,
            String postLogoutRedirectUri,
            String state);
}
