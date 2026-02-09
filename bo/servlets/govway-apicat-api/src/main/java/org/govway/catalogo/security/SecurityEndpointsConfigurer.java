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

import org.govway.catalogo.servlets.model.Configurazione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;

/**
 * Helper class per configurare in modo centralizzato le regole di autorizzazione
 * degli endpoint HTTP in Spring Security.
 *
 * Questa classe evita duplicazione di codice tra le diverse configurazioni di sicurezza
 * (WebSecurityConfiguration, OidcSecurityConfiguration) garantendo che le regole
 * di autorizzazione siano applicate in modo consistente.
 */
public class SecurityEndpointsConfigurer {

    private static final Logger logger = LoggerFactory.getLogger(SecurityEndpointsConfigurer.class);

    /**
     * Configura le regole di autorizzazione degli endpoint HTTP.
     *
     * Le regole applicate sono:
     * 1. `/pdnd/mock/**` - sempre pubblico (per tutti i profili/ambienti)
     * 2. Se accesso anonimo abilitato:
     *    - `/api/v1/**` - pubblico
     * 3. Se accesso anonimo disabilitato (autenticazione richiesta):
     *    - `/api/v1/profilo` - pubblico (endpoint per ottenere info utente)
     *    - Tutti gli altri endpoint - autenticazione richiesta
     *
     * @param http HttpSecurity builder da configurare
     * @param configurazione configurazione applicativa che contiene le impostazioni utente
     * @throws Exception in caso di errori di configurazione
     */
    public static void configureEndpoints(HttpSecurity http, Configurazione configurazione) throws Exception {
        boolean accessoAnonimoAbilitato = configurazione.getUtente().isConsentiAccessoAnonimo();

        logger.info("Configurazione endpoint security - Accesso anonimo abilitato: {}", accessoAnonimoAbilitato);

        http.authorizeHttpRequests(auth -> {
            // Endpoint sempre pubblici (indipendentemente dalla configurazione)
            auth.requestMatchers("/pdnd/mock/**").permitAll();

            if (accessoAnonimoAbilitato) {
                // Modalità accesso anonimo: tutti gli endpoint API sono pubblici
                logger.debug("Modalità accesso anonimo: tutti gli endpoint /api/v1/** sono pubblici");
                auth.requestMatchers("/api/v1/**").permitAll();
            } else {
                // Modalità autenticata: solo /profilo e /oidc/v1/token sono pubblici, il resto richiede autenticazione
                logger.debug("Modalità autenticata: solo /api/v1/profilo e /oidc/v1/* sono pubblici");
                auth.requestMatchers("/api/v1/profilo", "/oidc/v1/*").permitAll()
                    .anyRequest().authenticated();
            }
        });
    }
}
