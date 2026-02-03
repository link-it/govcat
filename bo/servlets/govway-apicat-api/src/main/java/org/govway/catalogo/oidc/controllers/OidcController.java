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
package org.govway.catalogo.oidc.controllers;

import org.govway.catalogo.OidcV1Controller;
import org.govway.catalogo.oidc.TokenApiDelegate;
import org.govway.catalogo.servlets.oidc.model.TokenResponse;
import org.govway.catalogo.servlets.oidc.server.api.TokenApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;

/**
 * Controller implementation for OIDC Token endpoints.
 *
 * This controller delegates all calls to the configured TokenApiDelegate implementation.
 * By default, if no oidc.service_class is configured, it uses DefaultTokenApiImpl
 * which returns 501 Not Implemented for all operations.
 *
 * To enable OIDC functionality, configure oidc.service_class with a class
 * implementing TokenApiDelegate that communicates with your OIDC provider.
 */
@OidcV1Controller
public class OidcController implements TokenApi {

    @Autowired
    private TokenApiDelegate oidcTokenApiDelegate;

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
        return this.oidcTokenApiDelegate.token(
                grantType, clientId, clientSecret, code, redirectUri,
                refreshToken, scope, clientAssertionType, clientAssertion, codeVerifier);
    }

    @Override
    public ResponseEntity<Void> revoke(
            String token,
            String tokenTypeHint,
            String clientId,
            String clientSecret,
            String clientAssertionType,
            String clientAssertion) {
        return this.oidcTokenApiDelegate.revoke(
                token, tokenTypeHint, clientId, clientSecret,
                clientAssertionType, clientAssertion);
    }
}
