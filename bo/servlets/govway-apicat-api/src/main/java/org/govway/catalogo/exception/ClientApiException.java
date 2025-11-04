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
package org.govway.catalogo.exception;

import java.util.Map;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiException;

public class ClientApiException extends AbstractGovCatException {

	private static final long serialVersionUID = 1L;
	private ApiException e;

	public ClientApiException(ApiException e) {
		super(e.getMessage(), null);
		this.e = e;
	}

	public ClientApiException(Throwable t) {
		super(t != null ? t.getMessage() : null, t);
	}

	/**
	 * Costruttore con ErrorCode
	 * @param errorCode il codice di errore
	 */
	public ClientApiException(ErrorCode errorCode) {
		this(errorCode, null, null, null);
	}

	/**
	 * Costruttore con ErrorCode e parametri
	 * @param errorCode il codice di errore
	 * @param parameters mappa dei parametri per il messaggio
	 */
	public ClientApiException(ErrorCode errorCode, Map<String, String> parameters) {
		this(errorCode, parameters, null, null);
	}

	/**
	 * Costruttore con ErrorCode e ApiException
	 * @param errorCode il codice di errore
	 * @param e l'eccezione API
	 */
	public ClientApiException(ErrorCode errorCode, ApiException e) {
		this(errorCode, null, e, null);
	}

	/**
	 * Costruttore completo con ErrorCode, parametri e ApiException
	 * @param errorCode il codice di errore
	 * @param parameters mappa dei parametri per il messaggio
	 * @param e l'eccezione API
	 * @param cause la causa dell'eccezione
	 */
	public ClientApiException(ErrorCode errorCode, Map<String, String> parameters, ApiException e, Throwable cause) {
		super(errorCode, parameters, cause);
		this.e = e;
	}

	public ApiException getE() {
		return e;
	}

	public void setE(ApiException e) {
		this.e = e;
	}
}
