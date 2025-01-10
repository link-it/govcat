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
package org.govway.catalogo.reverse_proxy.security;


import java.io.IOException;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.servlet.HandlerExceptionResolver;


/**
 * Questo filtro cattura le eccezioni sollevate durante la SecurityFilterChain di Spring.
 * 
 * Fa in modo di delegare al @ControllerAdvice (Il nostro RestResponseEntityExceptionHandler) la gestione delle eccezioni. 
 *
 */
@Component
public class PreAuthenticatedExceptionHandler extends OncePerRequestFilter {

	   private final Logger log = LoggerFactory.getLogger(getClass());

	    @Autowired
	    @Qualifier("handlerExceptionResolver")
	    private HandlerExceptionResolver resolver;

	    @Override
	    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
	            throws ServletException, IOException {

	        try {
	        	log.debug("Wrapping the filter chain in a try catch and delegating the exception handling to the RestResponseEntityExceptionHandler...");
	            filterChain.doFilter(request, response);
	        } catch (Exception e) {
	            log.error("Spring Security Filter Chain Exception:", e);
	            resolver.resolveException(request, response, null, e);
	        }
	    }
}
