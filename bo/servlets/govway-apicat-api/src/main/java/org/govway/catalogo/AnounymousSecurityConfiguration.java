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
package org.govway.catalogo;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configurazione di Spring Security per l'accesso anonimo.
 * Attiva quando authentication.mode=ANONYMOUS.
 *
 * In questa modalità:
 * - Nessun filtro di autenticazione viene applicato
 * - Spring Security permette tutte le richieste (permitAll)
 * - L'utente nel SecurityContext è sempre anonimo (non valorizzato)
 * - La whitelist è gestita da ReadOnlyModeInterceptor tramite configurazione.getGenerale().getWhitelistVetrina()
 */
@Configuration
@ConditionalOnExpression("'${authentication.mode:HEADER}' == 'ANONYMOUS'")
public class AnounymousSecurityConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(AnounymousSecurityConfiguration.class);

    @PostConstruct
    public void setup() {
        logger.warn("===========================================");
        logger.warn("ATTENZIONE: Modalità ANONYMOUS attiva!");
        logger.warn("L'utente non viene valorizzato in sessione.");
        logger.warn("Solo le operazioni in whitelist sono permesse.");
        logger.warn("===========================================");
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(h -> h
                .contentTypeOptions(c -> c.disable())
                .xssProtection(x -> x.disable())
                .frameOptions(f -> f.disable())
            )
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());

        return http.build();
    }
}
