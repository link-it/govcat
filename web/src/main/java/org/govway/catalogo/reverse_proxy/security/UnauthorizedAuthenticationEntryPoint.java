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
package org.govway.catalogo.reverse_proxy.security;


import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;

import jakarta.servlet.ServletException;
import jakarta.servlet.ServletOutputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.govway.catalogo.reverse_proxy.costanti.Costanti;
import org.govway.catalogo.reverse_proxy.models.Problem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import com.fasterxml.jackson.databind.ObjectMapper;


public class UnauthorizedAuthenticationEntryPoint implements AuthenticationEntryPoint {

	ObjectMapper jsonMapper;

	Logger logger = LoggerFactory.getLogger(UnauthorizedAuthenticationEntryPoint.class);

	public UnauthorizedAuthenticationEntryPoint(ObjectMapper mapper) {
		this.jsonMapper = mapper;
	}


	@Override
	public void commence(HttpServletRequest request, HttpServletResponse response, 	AuthenticationException authException) throws IOException, ServletException {

		logger.debug("Mappo la AuthenticationException in un problem: {}", authException.getMessage());

		Problem problem = new Problem();
		problem.setStatus(HttpStatus.UNAUTHORIZED.value());
		problem.setTitle(HttpStatus.UNAUTHORIZED.getReasonPhrase());
		problem.setDetail(authException.getMessage());
		try {
			problem.setInstance(new URI(Costanti.problemTypes.get(HttpStatus.UNAUTHORIZED)));
		} catch (URISyntaxException e) {
			logger.error("Errore nell'impostare la URI del problem", e);
		}

		// imposto il content-type della risposta
		response.addHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE);
		response.setStatus(problem.getStatus());

		ServletOutputStream outputStream = response.getOutputStream();
		this.jsonMapper.writeValue(outputStream, problem);
		outputStream.flush();
	}



}
