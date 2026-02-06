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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;

/**
 * Implementazione di default di TokenApiDelegate che lancia eccezioni per ogni metodo.
 *
 * Questa classe viene usata quando la property oidc.service_class non è configurata.
 * Per abilitare la funzionalità OIDC, configurare oidc.service_class con una classe
 * che implementa TokenApiDelegate con la logica per comunicare con il provider OIDC.
 */
public class DefaultTokenApiImpl implements TokenApiDelegate {

    private static final String OIDC_NOT_CONFIGURED_MESSAGE =
            "OIDC token endpoint non configurato. Configurare la property 'oidc.service_class' con un'implementazione di TokenApi.";

    @Override
    public ResponseEntity<TokenResponse> token(
            String grantType,
            String clientId,
            String clientSecret,
            String code,
            String redirectUri,
            String refreshToken,
            String scope,
            String clientAssertionType,
            String clientAssertion,
            String codeVerifier) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, OIDC_NOT_CONFIGURED_MESSAGE);
    }

    @Override
    public ResponseEntity<Void> revoke(
            String token,
            String tokenTypeHint,
            String clientId,
            String clientSecret,
            String clientAssertionType,
            String clientAssertion) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, OIDC_NOT_CONFIGURED_MESSAGE);
    }

    @Override
    public ResponseEntity<Void> logout(
            String idTokenHint,
            String postLogoutRedirectUri,
            String state) {
        throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED, OIDC_NOT_CONFIGURED_MESSAGE);
    }
}
