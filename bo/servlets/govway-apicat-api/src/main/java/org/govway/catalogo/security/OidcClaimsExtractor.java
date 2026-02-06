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
package org.govway.catalogo.security;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

/**
 * Estrattore e mappatore di claims da token JWT OIDC.
 * Supporta mapping configurabile di claims standard e custom.
 *
 * Attivo quando:
 * - configurazione.utenti.accesso_anonimo_abilitato=false (o non specificato, default=false)
 * - authentication.mode=OIDC_JWT
 */
@Component
@ConditionalOnExpression("!${configurazione.utenti.accesso_anonimo_abilitato:false} && '${authentication.mode:HEADER}' == 'OIDC_JWT'")
public class OidcClaimsExtractor {

    private static final Logger logger = LoggerFactory.getLogger(OidcClaimsExtractor.class);

    @Value("${oidc.claim.username:preferred_username}")
    private String usernameClaimName;

    @Value("${oidc.claim.email:email}")
    private String emailClaimName;

    @Value("${oidc.claim.firstName:given_name}")
    private String firstNameClaimName;

    @Value("${oidc.claim.lastName:family_name}")
    private String lastNameClaimName;

    @Value("${oidc.claim.cf:fiscalNumber}")
    private String cfClaimName;

    @Value("${oidc.claim.roles:realm_access.roles}")
    private String rolesClaimName;

    @Value("${oidc.claim.organization:organization}")
    private String organizationClaimName;

    @Value("${oidc.claim.telefono:phone_number}")
    private String telefonoClaimName;

    @Value("${oidc.claim.sede:sede}")
    private String sedeClaimName;

    @Value("${oidc.claim.matricola:matricola}")
    private String matricolaClaimName;

    /**
     * Holder ThreadLocal per i claims estratti dal token JWT.
     * Permette l'accesso ai claims durante l'elaborazione della richiesta.
     */
    private static final ThreadLocal<Map<String, Object>> jwtClaimsHolder = new ThreadLocal<>();

    /**
     * Estrae e salva tutti i claims dal token JWT nel ThreadLocal.
     * @param jwt token JWT validato
     */
    public void extractAndStoreClaims(Jwt jwt) {
        if (jwt != null) {
            logger.debug("Estrazione claims da JWT per subject: {}", jwt.getSubject());
            jwtClaimsHolder.set(jwt.getClaims());
        }
    }

    /**
     * Pulisce il ThreadLocal. Deve essere chiamato alla fine di ogni richiesta.
     */
    public void clearClaims() {
        jwtClaimsHolder.remove();
    }

    /**
     * Ottiene i claims correntemente memorizzati nel ThreadLocal.
     * @return Map dei claims o null se non presenti
     */
    public Map<String, Object> getCurrentClaims() {
        return jwtClaimsHolder.get();
    }

    /**
     * Estrae il valore di un claim, supportando la notazione a punti per nested claims.
     * Esempio: "realm_access.roles" naviga nell'oggetto realm_access e estrae roles
     *
     * @param claimPath path del claim (es. "email" o "realm_access.roles")
     * @return valore del claim o null se non presente
     */
    public Object getClaim(String claimPath) {
        Map<String, Object> claims = getCurrentClaims();
        if (claims == null || claimPath == null) {
            return null;
        }

        // Gestisce claims semplici
        if (!claimPath.contains(".")) {
            return claims.get(claimPath);
        }

        // Gestisce nested claims (es. realm_access.roles)
        String[] parts = claimPath.split("\\.");
        Object current = claims;

        for (String part : parts) {
            if (current instanceof Map) {
                current = ((Map<?, ?>) current).get(part);
            } else {
                return null;
            }
        }

        return current;
    }

    /**
     * Estrae un claim come stringa.
     * @param claimPath path del claim
     * @return valore come stringa o null
     */
    public String getClaimAsString(String claimPath) {
        Object value = getClaim(claimPath);
        return value != null ? value.toString() : null;
    }

    /**
     * Estrae un claim come lista di stringhe.
     * @param claimPath path del claim
     * @return lista di stringhe o lista vuota
     */
    @SuppressWarnings("unchecked")
    public List<String> getClaimAsList(String claimPath) {
        Object value = getClaim(claimPath);
        if (value instanceof List) {
            List<String> result = new ArrayList<>();
            for (Object item : (List<?>) value) {
                if (item != null) {
                    result.add(item.toString());
                }
            }
            return result;
        } else if (value != null) {
            // Se è un singolo valore, lo restituiamo come lista con un elemento
            List<String> result = new ArrayList<>();
            result.add(value.toString());
            return result;
        }
        return new ArrayList<>();
    }

    // Metodi di convenienza per i claim mappati

    public String getUsername() {
        return getClaimAsString(usernameClaimName);
    }

    public String getEmail() {
        return getClaimAsString(emailClaimName);
    }

    public String getFirstName() {
        return getClaimAsString(firstNameClaimName);
    }

    public String getLastName() {
        return getClaimAsString(lastNameClaimName);
    }

    public String getCf() {
        return getClaimAsString(cfClaimName);
    }

    public List<String> getRoles() {
        return getClaimAsList(rolesClaimName);
    }

    public String getOrganization() {
        return getClaimAsString(organizationClaimName);
    }

    public String getTelefono() {
        return getClaimAsString(telefonoClaimName);
    }

    public String getSede() {
        return getClaimAsString(sedeClaimName);
    }

    public String getMatricola() {
        return getClaimAsString(matricolaClaimName);
    }

    /**
     * Verifica se sono presenti claims JWT nel ThreadLocal.
     * @return true se presenti claims JWT
     */
    public boolean hasJwtClaims() {
        return getCurrentClaims() != null;
    }
}
