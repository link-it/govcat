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
import java.net.URI;
import java.net.URISyntaxException;

import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.govway.catalogo.servlets.model.Problem;
import org.govway.catalogo.servlets.model.UpdateEntitaComplessaProblem;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.PropertyNamingStrategy;


@ControllerAdvice
public class ControllerAdvisor extends AbstractControllerAdvisor {

	private Logger logger = LoggerFactory.getLogger(ControllerAdvisor.class);

	protected ResponseEntity<Object> toEntity(Exception ex, HttpStatus status) {
		
		if(ex instanceof UpdateEntitaComplessaNonValidaSemanticamenteException) {
			UpdateEntitaComplessaProblem problem = new UpdateEntitaComplessaProblem();
			problem.setStatus(status.value());
			problem.setTitle(status.getReasonPhrase());
			try {problem.setType(new URI("https://tools.ietf.org/html/rfc7231#section-6.5.1"));} catch (URISyntaxException e) {}
			problem.setDetail(ex.getMessage());

			problem.setErrori(((UpdateEntitaComplessaNonValidaSemanticamenteException)ex).getErrori());
			return new ResponseEntity<>(problem, status);

		} else {
			Problem problem = new Problem();
			problem.setStatus(status.value());
			problem.setTitle(status.getReasonPhrase());
			try {problem.setType(new URI("https://tools.ietf.org/html/rfc7231#section-6.5.1"));} catch (URISyntaxException e) {}
			problem.setDetail(ex.getMessage());

			return new ResponseEntity<>(problem, status);
		}
		
	}

	@Override
	protected ResponseEntity<Object> toEntity(ClientApiException ex) {
		
		
		ObjectMapper om = new ObjectMapper();
		om.setPropertyNamingStrategy(PropertyNamingStrategy.SNAKE_CASE);
		
		Problem problem;
		HttpStatus status;
		try {
			problem = om.readValue(ex.getE().getResponseBody().getBytes(), Problem.class);
			status = HttpStatus.resolve(problem.getStatus());
		} catch(Exception e) {
			logger.error("Errore serializzazione: " + e.getMessage(), e);
			status = HttpStatus.resolve(ex.getE().getCode());
			problem = new Problem();
			problem.setStatus(status.value());
			problem.setTitle(status.getReasonPhrase());
			try {problem.setType(new URI("https://TODO"));} catch (URISyntaxException ec) {}
			problem.setDetail(ex.getMessage());
		}

		return new ResponseEntity<>(problem, status);
	} 


}
