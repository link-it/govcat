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

/**
 * Modalità di autenticazione supportate dall'applicazione.
 * La modalità viene configurata tramite la property authentication.mode
 */
public enum AuthenticationMode {

    /**
     * Autenticazione basata su header HTTP (modalità legacy).
     * Il principal viene estratto dall'header configurato in ${headerAuthentication}.
     * Tutti i dati utente vengono estratti dagli header HTTP.
     * Non viene effettuata alcuna validazione, si presume protezione infrastrutturale.
     */
    HEADER,

    /**
     * Autenticazione basata su token JWT OIDC.
     * Il token JWT viene estratto dall'header Authorization (Bearer token).
     * Il token viene validato tramite JWKS endpoint del provider OIDC.
     * I dati utente vengono estratti dai claims del token JWT.
     * Supporta mapping configurabile dei claims.
     */
    OIDC_JWT;

    /**
     * Ottiene la modalità di autenticazione dalla stringa di configurazione.
     * @param mode stringa della modalità (case insensitive)
     * @return AuthenticationMode corrispondente
     * @throws IllegalArgumentException se la modalità non è supportata
     */
    public static AuthenticationMode fromString(String mode) {
        if (mode == null || mode.trim().isEmpty()) {
            return HEADER; // default per retrocompatibilità
        }

        try {
            return AuthenticationMode.valueOf(mode.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                "Modalità di autenticazione non supportata: " + mode +
                ". Valori validi: HEADER, OIDC_JWT", e);
        }
    }
}
