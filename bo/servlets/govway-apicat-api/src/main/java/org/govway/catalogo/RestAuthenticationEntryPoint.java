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
package org.govway.catalogo;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.List;

import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.servlets.model.EntitaComplessaError;
import org.govway.catalogo.servlets.model.Problem;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public final class RestAuthenticationEntryPoint implements AuthenticationEntryPoint {

	private static final String JSON_MEDIA_TYPE = "application/json";

	@Override
	public void commence(final HttpServletRequest request, final HttpServletResponse response, final AuthenticationException authException) throws IOException {
		if(authException != null) {

			Problem problem = new Problem();
			problem.setStatus(HttpStatus.UNAUTHORIZED.value());
			problem.setTitle(HttpStatus.UNAUTHORIZED.getReasonPhrase());
			try {
				problem.setType(new URI("https://tools.ietf.org/html/rfc7235#section-3.1"));
			} catch (URISyntaxException e) {
				// URI statica, non può fallire
			}
			problem.setDetail(ErrorCode.AUT_401.getCode());

			EntitaComplessaError errore = new EntitaComplessaError();
			problem.setErrori(List.of(errore));

			ObjectMapper om = new ObjectMapper();
			om.setPropertyNamingStrategy(PropertyNamingStrategies.SNAKE_CASE);

			response.setStatus(HttpStatus.UNAUTHORIZED.value());
			response.setContentType(JSON_MEDIA_TYPE);

			om.writeValue(response.getOutputStream(), problem);

		}
	}

}
