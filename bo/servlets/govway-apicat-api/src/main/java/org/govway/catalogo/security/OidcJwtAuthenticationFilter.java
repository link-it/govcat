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

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.govway.catalogo.servlets.model.Configurazione;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.web.authentication.preauth.PreAuthenticatedAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter per l'autenticazione tramite token JWT OIDC.
 * Estrae il token Bearer dall'header Authorization, lo valida e imposta l'autenticazione.
 */
public class OidcJwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(OidcJwtAuthenticationFilter.class);
    private static final String AUTHORIZATION_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";

    @Autowired
    private JwtTokenValidator jwtTokenValidator;

    @Autowired
    private OidcClaimsExtractor oidcClaimsExtractor;

    @Autowired
    private Configurazione configurazione;

    private final AuthenticationManager authenticationManager;

    public OidcJwtAuthenticationFilter(AuthenticationManager authenticationManager) {
        this.authenticationManager = authenticationManager;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

    	
    	if(!this.configurazione.getUtente().isConsentiAccessoAnonimo()) {
	        try {
	            // Estrae il token JWT dalla richiesta
	            String token = extractBearerToken(request);
	
	            if (token != null) {
	                logger.debug("Token JWT trovato nella richiesta");
	
	                // Valida il token
	                Jwt jwt = jwtTokenValidator.validateAndDecode(token);
	
	                // Estrae i claims e li memorizza nel ThreadLocal
	                oidcClaimsExtractor.extractAndStoreClaims(jwt);
	
	                // Estrae il principal (username) dal token
	                String principal = oidcClaimsExtractor.getUsername();
	
	                if (principal == null || principal.trim().isEmpty()) {
	                    // Se non c'è username configurato, usa il subject del token
	                    principal = jwt.getSubject();
	                }
	
	                logger.debug("Autenticazione JWT per principal: {}", principal);
	
	                // Crea il token di autenticazione
	                PreAuthenticatedAuthenticationToken authToken =
	                    new PreAuthenticatedAuthenticationToken(principal, token);
	
	                // Autentica tramite l'AuthenticationManager
	                authToken = (PreAuthenticatedAuthenticationToken)
	                    authenticationManager.authenticate(authToken);
	
	                // Imposta l'autenticazione nel SecurityContext
	                SecurityContextHolder.getContext().setAuthentication(authToken);
	
	                logger.debug("Autenticazione JWT completata con successo per: {}", principal);
	            } else {
	                logger.debug("Nessun token JWT trovato nella richiesta");
	            }
	        } catch (JwtException e) {
	            logger.warn("Errore di validazione JWT: {}", e.getMessage());
	            // Non impostiamo l'autenticazione, lasciamo che l'AuthenticationEntryPoint gestisca l'errore
	            SecurityContextHolder.clearContext();
	        } catch (Exception e) {
	            logger.error("Errore durante l'autenticazione JWT", e);
	            SecurityContextHolder.clearContext();
	        }
    		
    	}

        try {
            // Prosegue con la filter chain
            filterChain.doFilter(request, response);
        } finally {
            // Pulisce il ThreadLocal alla fine della richiesta
            oidcClaimsExtractor.clearClaims();
        }
    }

    /**
     * Estrae il token Bearer dall'header Authorization.
     *
     * @param request richiesta HTTP
     * @return token JWT o null se non presente
     */
    private String extractBearerToken(HttpServletRequest request) {
        String authorizationHeader = request.getHeader(AUTHORIZATION_HEADER);

        if (StringUtils.hasText(authorizationHeader) && authorizationHeader.startsWith(BEARER_PREFIX)) {
            return authorizationHeader.substring(BEARER_PREFIX.length());
        }

        return null;
    }
}
