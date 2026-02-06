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

import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ClientApiException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.exception.NotFoundException;
import org.govway.catalogo.exception.RichiestaNonValidaSemanticamenteException;
import org.govway.catalogo.exception.UpdateEntitaComplessaNonValidaSemanticamenteException;
import org.hibernate.service.spi.ServiceException;
import org.springframework.core.convert.ConversionFailedException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import org.springframework.web.util.WebUtils;

import com.fasterxml.jackson.databind.exc.InvalidDefinitionException;
import com.fasterxml.jackson.databind.exc.ValueInstantiationException;

public abstract class AbstractControllerAdvisor extends ResponseEntityExceptionHandler {

	protected ResponseEntity<Object> handleExceptionInternal(
			Exception ex, @Nullable Object body, HttpHeaders headers, HttpStatus status, WebRequest request) {


		if (HttpStatus.INTERNAL_SERVER_ERROR.equals(status)) {
			request.setAttribute(WebUtils.ERROR_EXCEPTION_ATTRIBUTE, ex, WebRequest.SCOPE_REQUEST);
		}

		return toEntity(ex, status);

	}

	@ExceptionHandler({ConflictException.class})
	public ResponseEntity<Object> handleConflict(RuntimeException ex) {
		return toEntity(ex, HttpStatus.CONFLICT);
	}

	@ExceptionHandler({ClientApiException.class})
	public ResponseEntity<Object> handleClientApiException(ClientApiException ex) {
		return toEntity(ex);
	}

	@ExceptionHandler(ConversionFailedException.class)
	public ResponseEntity<Object> handleConversionFailedException(RuntimeException ex) {
		return toEntity(ex, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler({BadRequestException.class, InvalidDefinitionException.class, ValueInstantiationException.class})
	public ResponseEntity<Object> handleBadRequest(RuntimeException ex) {
		return toEntity(ex, HttpStatus.BAD_REQUEST);
	}

	@ExceptionHandler({RichiestaNonValidaSemanticamenteException.class, UpdateEntitaComplessaNonValidaSemanticamenteException.class})
	public ResponseEntity<Object> handleUnprocessableEntity(RuntimeException ex) {
		return toEntity(ex, HttpStatus.UNPROCESSABLE_ENTITY);
	}

	@ExceptionHandler({NotFoundException.class, org.govway.catalogo.core.exceptions.NotFoundException.class})
	public ResponseEntity<Object> handleNotFound(RuntimeException ex) {
		return toEntity(ex, HttpStatus.NOT_FOUND);
	}

	@ExceptionHandler({NotAuthorizedException.class})
	public ResponseEntity<Object> handleNotAuthorized(RuntimeException ex) {
		return toEntity(ex, HttpStatus.FORBIDDEN);
	}

	@ExceptionHandler({InternalException.class, ServiceException.class})
	public final ResponseEntity<Object> handleAllInternalExceptions(InternalException ex, WebRequest request) {
		return toEntity(ex, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	/**
	 * Handler generico per tutte le eccezioni non gestite.
	 * Restituisce 500 Internal Server Error per evitare che eccezioni non gestite
	 * vengano interpretate dalla security filter chain come errori di autenticazione.
	 */
	@ExceptionHandler(Exception.class)
	public final ResponseEntity<Object> handleGenericException(Exception ex, WebRequest request) {
		return toEntity(ex, HttpStatus.INTERNAL_SERVER_ERROR);
	}

	protected abstract ResponseEntity<Object> toEntity(Exception ex, HttpStatus status);
	protected abstract ResponseEntity<Object> toEntity(ClientApiException ex);


}
