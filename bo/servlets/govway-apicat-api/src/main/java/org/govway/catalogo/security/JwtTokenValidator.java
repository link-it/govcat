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
package org.govway.catalogo.security;

import jakarta.annotation.PostConstruct;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Validatore di token JWT OIDC.
 * Configura e utilizza il JwtDecoder di Spring Security per validare i token JWT.
 * Esegue validazioni di:
 * - Firma del token (tramite JWKS endpoint)
 * - Issuer
 * - Audience (opzionale)
 * - Scadenza e tempi di validità
 *
 * Attivo quando:
 * - configurazione.utenti.accesso_anonimo_abilitato=false (o non specificato, default=false)
 * - authentication.mode=OIDC_JWT
 */
@Component
@ConditionalOnExpression("!${configurazione.utenti.accesso_anonimo_abilitato:false} && '${authentication.mode:HEADER}' == 'OIDC_JWT'")
public class JwtTokenValidator {

    private static final Logger logger = LoggerFactory.getLogger(JwtTokenValidator.class);

    @Value("${oidc.jwks.uri}")
    private String jwksUri;

    @Value("${oidc.issuer.uri}")
    private String issuerUri;

    @Value("${oidc.audience:#{null}}")
    private String audience;

    private JwtDecoder jwtDecoder;

    /**
     * Inizializza il JwtDecoder con le configurazioni OIDC.
     * Viene chiamato automaticamente dopo l'injection delle properties.
     */
    @PostConstruct
    public void initialize() {
        if (jwtDecoder != null) {
            return; // già inizializzato
        }

        logger.info("Inizializzazione JwtTokenValidator con JWKS URI: {}", jwksUri);

        // Crea il decoder usando l'endpoint JWKS
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwksUri).build();

        // Configura i validator
        List<OAuth2TokenValidator<Jwt>> validators = new ArrayList<>();

        // Validator standard per issuer e timestamp
        validators.add(JwtValidators.createDefaultWithIssuer(issuerUri));

        // Validator per audience (se configurato)
        if (audience != null && !audience.trim().isEmpty()) {
            validators.add(new AudienceValidator(audience));
        }

        // Combina tutti i validator
        OAuth2TokenValidator<Jwt> combinedValidator = new DelegatingOAuth2TokenValidator<>(validators);
        decoder.setJwtValidator(combinedValidator);

        this.jwtDecoder = decoder;
        logger.info("JwtTokenValidator inizializzato con successo");
    }

    /**
     * Valida e decodifica un token JWT.
     *
     * @param token stringa del token JWT
     * @return JWT decodificato e validato
     * @throws JwtException se il token non è valido
     */
    public Jwt validateAndDecode(String token) {
        if (jwtDecoder == null) {
            initialize();
        }

        try {
            Jwt jwt = jwtDecoder.decode(token);
            logger.debug("Token JWT validato con successo per subject: {}", jwt.getSubject());
            return jwt;
        } catch (JwtException e) {
            logger.warn("Token JWT non valido: {}", e.getMessage());
            throw e;
        }
    }

    /**
     * Verifica se un token è valido senza generare eccezioni.
     *
     * @param token stringa del token JWT
     * @return true se il token è valido, false altrimenti
     */
    public boolean isTokenValid(String token) {
        try {
            validateAndDecode(token);
            return true;
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Validator custom per verificare l'audience del token.
     */
    private static class AudienceValidator implements OAuth2TokenValidator<Jwt> {
        private final String expectedAudience;

        public AudienceValidator(String expectedAudience) {
            this.expectedAudience = expectedAudience;
        }

        @Override
        public org.springframework.security.oauth2.core.OAuth2TokenValidatorResult validate(Jwt jwt) {
            List<String> audiences = jwt.getAudience();

            if (audiences != null && audiences.contains(expectedAudience)) {
                return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.success();
            }

            return org.springframework.security.oauth2.core.OAuth2TokenValidatorResult.failure(
                new org.springframework.security.oauth2.core.OAuth2Error(
                    "invalid_token",
                    "Token audience non valido. Atteso: " + expectedAudience,
                    null
                )
            );
        }
    }
}
