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

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.govway.catalogo.servlets.model.Problem;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;

@Component
public final class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Override
    public void commence(final HttpServletRequest request, final HttpServletResponse response, final AuthenticationException authException) throws IOException {
    	if(authException != null) {
    		
    			Problem problem = new Problem();
    			problem.setStatus(HttpStatus.FORBIDDEN.value());
    			problem.setTitle(HttpStatus.FORBIDDEN.getReasonPhrase());
    			try {problem.setType(new URI("https://tools.ietf.org/html/rfc7231#section-6.5.1"));} catch (URISyntaxException e) {}
    			problem.setDetail("Full authentication required");

    			ObjectMapper om = new ObjectMapper();
    			om.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);

    			response.setStatus(HttpStatus.FORBIDDEN.value());
    			response.setContentType("application/json+problem");
    			
    			om.writeValue(response.getOutputStream(), problem);
    			
    	}
    }

}
