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
package org.govway.catalogo.servlets.oidc.server.api.impl;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

import org.govway.catalogo.oidc.TokenApiDelegate;
import org.govway.catalogo.servlets.oidc.model.TokenResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

/**
 * Implementazione di TokenApiDelegate che fa da proxy verso un provider OIDC esterno.
 *
 * Il bean viene attivato solo se:
 *   oidc.service_class=org.govway.catalogo.servlets.oidc.server.api.impl.ProxyTokenApiDelegate
 *
 * In tal caso sono obbligatorie le seguenti properties:
 *   oidc.proxy.token.url=https://your-oidc-provider/token
 *   oidc.proxy.client_id=your-client-id
 *   oidc.proxy.client_secret=your-client-secret
 *   oidc.proxy.logout.url=https://your-oidc-provider/logout
 */
@Component
@ConditionalOnProperty(name = "oidc.service_class", havingValue = "org.govway.catalogo.servlets.oidc.server.api.impl.ProxyTokenApiDelegate")
public class ProxyTokenApiDelegate implements TokenApiDelegate {

    private static final Logger logger = LoggerFactory.getLogger(ProxyTokenApiDelegate.class);
    private static final Logger dumpLogger = LoggerFactory.getLogger("oidc.dump");

    private static final DateTimeFormatter TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");

    private static final Set<String> SENSITIVE_PARAMS = new HashSet<>(Arrays.asList(
            "client_secret", "code", "refresh_token", "client_assertion", "code_verifier", "token", "access_token"
    ));

    @Value("${oidc.proxy.token.url}")
    private String tokenUrl;

    @Value("${oidc.proxy.client_id}")
    private String proxyClientId;

    @Value("${oidc.proxy.client_secret}")
    private String proxyClientSecret;

    @Value("${oidc.proxy.logout.url}")
    private String logoutUrl;

    @Value("${oidc.proxy.dump.enabled:false}")
    private boolean dumpEnabled;

    private final RestTemplate restTemplate;

    public ProxyTokenApiDelegate() {
        this.restTemplate = new RestTemplate();
    }

    @Override
    public ResponseEntity<Void> logout(String idTokenHint, String postLogoutRedirectUri, String state) {

        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        logger.info("[{}] GET /logout", timestamp);

        if (dumpEnabled) {
            dumpLogger.info("[{}] GET /logout request - post_logout_redirect_uri={}, state={}",
                    timestamp, postLogoutRedirectUri, state);
        }

        StringBuilder redirectUrl = new StringBuilder(logoutUrl);
        //if (postLogoutRedirectUri != null) {
            //redirectUrl.append(logoutUrl.contains("?") ? "&" : "?");
            //redirectUrl.append("post_logout_redirect_uri=").append(URI.create(postLogoutRedirectUri).toASCIIString());
        //}

        logger.info("[{}] GET /logout - result: 302 -> {}", timestamp, redirectUrl);

        if (dumpEnabled) {
            dumpLogger.info("[{}] GET /logout response - status=302, location={}", timestamp, redirectUrl);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl.toString())
                .build();
    }

    @Override
    public ResponseEntity<Void> revoke(String token, String tokenTypeHint, String clientId,
            String clientSecret, String clientAssertionType, String clientAssertion) {

        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        logger.info("[{}] POST /revoke - token_type_hint={}", timestamp, tokenTypeHint);

        if (dumpEnabled) {
            dumpLogger.info("[{}] POST /revoke request - token_type_hint={}, client_id={}",
                    timestamp, tokenTypeHint, maskSensitive("client_id", clientId));
        }

        logger.info("[{}] POST /revoke - result: 200 OK", timestamp);

        if (dumpEnabled) {
            dumpLogger.info("[{}] POST /revoke response - status=200 OK", timestamp);
        }

        return ResponseEntity.ok().build();
    }

    @Override
    public ResponseEntity<TokenResponse> token(String grantType, String clientId, String clientSecret,
            String code, String redirectUri, String refreshToken, String scope,
            String clientAssertionType, String clientAssertion, String codeVerifier) {

        String timestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
        logger.info("[{}] POST /token - grant_type={}, scope={}", timestamp, grantType, scope);

        if (dumpEnabled) {
            dumpLogger.info("[{}] POST /token request - grant_type={}, scope={}, redirect_uri={}, client_assertion_type={}",
                    timestamp, grantType, scope, redirectUri, clientAssertionType);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        // Parametri obbligatori aggiunti dalle properties
        params.add("client_id", proxyClientId);
	if(proxyClientSecret != null && !proxyClientSecret.isEmpty()) {
        	params.add("client_secret", proxyClientSecret);
	}

        // Parametri dalla richiesta originale
        if (grantType != null) {
            params.add("grant_type", grantType);
        }
        if (code != null) {
            params.add("code", code);
        }
        if (redirectUri != null) {
            params.add("redirect_uri", redirectUri);
        }
        if (refreshToken != null) {
            params.add("refresh_token", refreshToken);
        }
        if (scope != null) {
            params.add("scope", scope);
        }
        if (clientAssertionType != null) {
            params.add("client_assertion_type", clientAssertionType);
        }
        if (clientAssertion != null) {
            params.add("client_assertion", clientAssertion);
        }
        if (codeVerifier != null) {
            params.add("code_verifier", codeVerifier);
        }

        if (dumpEnabled) {
            dumpLogger.info("[{}] POST /token forwarding to {} - params: {}",
                    timestamp, tokenUrl, maskParams(params));
        }

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        try {
            ResponseEntity<TokenResponse> response = restTemplate.postForEntity(
                    tokenUrl, request, TokenResponse.class);

            HttpStatus status = HttpStatus.resolve(response.getStatusCode().value());
            String responseTimestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);

            logger.info("[{}] POST /token - result: {}", responseTimestamp, status);

            if (dumpEnabled) {
                TokenResponse body = response.getBody();
                dumpLogger.info("[{}] POST /token response - status={}, token_type={}, expires_in={}, scope={}",
                        responseTimestamp, status,
                        body != null ? body.getTokenType() : null,
                        body != null ? body.getExpiresIn() : null,
                        body != null ? body.getScope() : null);
            }

            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());

        } catch (HttpStatusCodeException e) {
            String responseTimestamp = LocalDateTime.now().format(TIMESTAMP_FORMAT);
            logger.error("[{}] POST /token - error: {} - {}", responseTimestamp,
                    e.getStatusCode(), e.getStatusText());

            if (dumpEnabled) {
                dumpLogger.error("[{}] POST /token error response - status={}, body={}",
                        responseTimestamp, e.getStatusCode(), e.getResponseBodyAsString());
            }

            throw e;
        }
    }

    private String maskParams(MultiValueMap<String, String> params) {
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (String key : params.keySet()) {
            if (!first) {
                sb.append(", ");
            }
            first = false;
            sb.append(key).append("=");
            if (SENSITIVE_PARAMS.contains(key.toLowerCase())) {
                sb.append("***MASKED***");
            } else {
                sb.append(params.getFirst(key));
            }
        }
        sb.append("}");
        return sb.toString();
    }

    private String maskSensitive(String paramName, String value) {
        if (value == null) {
            return null;
        }
        if (SENSITIVE_PARAMS.contains(paramName.toLowerCase())) {
            return "***MASKED***";
        }
        return value;
    }
}
