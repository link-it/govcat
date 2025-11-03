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
package org.govway.catalogo.impl;

import jakarta.annotation.PostConstruct;

import java.util.List;

import org.govway.catalogo.security.OidcClaimsExtractor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.stereotype.Component;

/**
 * Implementazione di RequestUtils per la modalità di autenticazione OIDC tramite token JWT.
 * Estrae tutti i dati utente dai claims del token JWT validato.
 *
 * Attiva quando:
 * - configurazione.utenti.accesso_anonimo_abilitato=false (o non specificato, default=false)
 * - authentication.mode=OIDC_JWT
 *
 * Utilizza OidcClaimsExtractor per accedere ai claims del token JWT
 * che è stato precedentemente validato da OidcJwtAuthenticationFilter.
 */
@Component
@ConditionalOnExpression("!${configurazione.utenti.accesso_anonimo_abilitato:false} && '${authentication.mode:HEADER}' == 'OIDC_JWT'")
public class OidcRequestUtils extends AbstractRequestUtils {

    @Autowired
    private OidcClaimsExtractor oidcClaimsExtractor;

    @PostConstruct
    public void init() {
        logger.info("OidcRequestUtils inizializzato - Modalità: OIDC_JWT");
    }

    // ========================================================================
    // Implementazione metodi astratti
    // ========================================================================

    @Override
    protected String extractEmail() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getEmail();
    }

    @Override
    protected String extractFirstName() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getFirstName();
    }

    @Override
    protected String extractLastName() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getLastName();
    }

    @Override
    protected String extractCf() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getCf();
    }

    @Override
    protected String extractUsername() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getUsername();
    }

    @Override
    protected String extractOrganization() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getOrganization();
    }

    @Override
    protected List<String> extractRuoli() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        List<String> roles = oidcClaimsExtractor.getRoles();
        return (roles != null && !roles.isEmpty()) ? roles : null;
    }

    @Override
    protected String extractSede() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getSede();
    }

    @Override
    protected String extractTelefono() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getTelefono();
    }

    @Override
    protected String extractMatricola() {
        if (oidcClaimsExtractor == null) {
            logger.warn("OidcClaimsExtractor non disponibile");
            return null;
        }
        return oidcClaimsExtractor.getMatricola();
    }

    @Override
    protected String extractClassi() {
        // Le classi non sono supportate in modalità OIDC
        // Questo campo è specifico della modalità HEADER legacy
        return null;
    }

    // ========================================================================
    // Override specifici per modalità OIDC_JWT
    // ========================================================================

    @Override
    public String getHeaderAuthentication() {
        // In modalità OIDC non usiamo header di autenticazione personalizzato
        // L'autenticazione avviene tramite header Authorization standard
        return null;
    }

    @Override
    public String getClassi() {
        // Le classi utente non sono supportate in modalità OIDC
        // manteniamo il metodo per compatibilità interfaccia ma restituiamo null
        return null;
    }
}
