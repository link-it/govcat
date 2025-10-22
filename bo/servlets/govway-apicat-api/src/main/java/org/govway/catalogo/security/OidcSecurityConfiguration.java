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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.preauth.AbstractPreAuthenticatedProcessingFilter;

/**
 * Configurazione di Spring Security per l'autenticazione OIDC tramite token JWT.
 * Attiva solo quando authentication.mode=OIDC_JWT
 */
@Configuration
@ConditionalOnProperty(name = "authentication.mode", havingValue = "OIDC_JWT")
public class OidcSecurityConfiguration {

    private static final Logger logger = LoggerFactory.getLogger(OidcSecurityConfiguration.class);

    @Value("${spring.mvc.servlet.path}")
    private String path;

    @Autowired
    private org.govway.catalogo.RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    public OidcSecurityConfiguration() {
        logger.info("Inizializzazione OidcSecurityConfiguration - Modalità: OIDC_JWT");
    }

    /**
     * Crea il bean per l'OidcJwtAuthenticationFilter.
     * Questo filter gestisce l'estrazione e validazione dei token JWT.
     *
     * @param authenticationManager manager di autenticazione
     * @return filter configurato
     */
    @Bean
    public OidcJwtAuthenticationFilter oidcJwtAuthenticationFilter(AuthenticationManager authenticationManager) {
        logger.info("Creazione OidcJwtAuthenticationFilter");
        return new OidcJwtAuthenticationFilter(authenticationManager);
    }

    /**
     * Configura la SecurityFilterChain per l'autenticazione OIDC.
     * Aggiunge l'OidcJwtAuthenticationFilter alla catena di filtri.
     *
     * @param http HttpSecurity builder
     * @param oidcJwtAuthenticationFilter filter per JWT
     * @return SecurityFilterChain configurata
     * @throws Exception in caso di errori di configurazione
     */
    @Bean
    public SecurityFilterChain oidcSecurityFilterChain(
            HttpSecurity http,
            OidcJwtAuthenticationFilter oidcJwtAuthenticationFilter) throws Exception {

        logger.info("Configurazione SecurityFilterChain per modalità OIDC_JWT");

        http
            .sessionManagement(sm -> sm.sessionCreationPolicy(
                org.springframework.security.config.http.SessionCreationPolicy.STATELESS))
            .addFilterBefore(oidcJwtAuthenticationFilter, AbstractPreAuthenticatedProcessingFilter.class)
            .headers(h -> h
                .contentTypeOptions(c -> c.disable())
                .xssProtection(x -> x.disable())
                .frameOptions(f -> f.disable())
            )
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(eh -> eh.authenticationEntryPoint(restAuthenticationEntryPoint))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/profilo").permitAll()
                .anyRequest().authenticated()
            );

        logger.info("SecurityFilterChain OIDC configurata con successo");
        return http.build();
    }
}
