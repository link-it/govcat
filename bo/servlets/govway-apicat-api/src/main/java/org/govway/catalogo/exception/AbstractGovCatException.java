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
package org.govway.catalogo.exception;

import java.util.Map;

/**
 * Eccezione astratta base per tutte le eccezioni di GovCat.
 * Fornisce gestione centralizzata di ErrorCode e parametri.
 */
public abstract class AbstractGovCatException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private ErrorCode errorCode;
	private Map<String, String> parameters;

	/**
	 * Costruttore protetto con ErrorCode, parametri e causa
	 * @param errorCode il codice di errore
	 * @param parameters mappa dei parametri per il messaggio
	 * @param cause la causa dell'eccezione
	 */
	protected AbstractGovCatException(ErrorCode errorCode, Map<String, String> parameters, Throwable cause) {
		super(errorCode.getCode(), cause);
		this.errorCode = errorCode;
		this.parameters = parameters;
	}

	/**
	 * Costruttore protetto per costruttori legacy (senza ErrorCode)
	 * @param message il messaggio di errore
	 * @param cause la causa dell'eccezione
	 */
	protected AbstractGovCatException(String message, Throwable cause) {
		super(message, cause);
		this.errorCode = null;
		this.parameters = null;
	}

	/**
	 * Restituisce il codice di errore
	 * @return il codice di errore
	 */
	public ErrorCode getErrorCode() {
		return errorCode;
	}

	/**
	 * Restituisce i parametri utilizzati per il messaggio
	 * @return la mappa dei parametri
	 */
	public Map<String, String> getParameters() {
		return parameters;
	}

}
