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

import java.util.List;
import java.util.Map;

import org.govway.catalogo.servlets.model.EntitaComplessaError;

public class UpdateEntitaComplessaNonValidaSemanticamenteException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private List<EntitaComplessaError> errori;
	private ErrorCode errorCode;
	private Map<String, String> parameters;

	public UpdateEntitaComplessaNonValidaSemanticamenteException(String message, List<EntitaComplessaError> errori) {
		super(message);
		this.setErrori(errori);
	}

	public UpdateEntitaComplessaNonValidaSemanticamenteException(Throwable t, List<EntitaComplessaError> errori) {
		super(t);
		this.setErrori(errori);
	}

	/**
	 * Costruttore con ErrorCode ed errori
	 * @param errorCode il codice di errore
	 * @param errori lista degli errori
	 */
	public UpdateEntitaComplessaNonValidaSemanticamenteException(ErrorCode errorCode, List<EntitaComplessaError> errori) {
		this(errorCode, null, errori, null);
	}

	/**
	 * Costruttore con ErrorCode, parametri ed errori
	 * @param errorCode il codice di errore
	 * @param parameters mappa dei parametri per il messaggio
	 * @param errori lista degli errori
	 */
	public UpdateEntitaComplessaNonValidaSemanticamenteException(ErrorCode errorCode, Map<String, String> parameters, List<EntitaComplessaError> errori) {
		this(errorCode, parameters, errori, null);
	}

	/**
	 * Costruttore completo con ErrorCode, parametri, errori e causa
	 * @param errorCode il codice di errore
	 * @param parameters mappa dei parametri per il messaggio
	 * @param errori lista degli errori
	 * @param cause la causa dell'eccezione
	 */
	public UpdateEntitaComplessaNonValidaSemanticamenteException(ErrorCode errorCode, Map<String, String> parameters, List<EntitaComplessaError> errori, Throwable cause) {
		super(ErrorMessageResolver.resolveMessage(errorCode, parameters), cause);
		this.errorCode = errorCode;
		this.parameters = parameters;
		this.errori = errori;
	}

	public List<EntitaComplessaError> getErrori() {
		return errori;
	}

	public void setErrori(List<EntitaComplessaError> errori) {
		this.errori = errori;
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

	/**
	 * Restituisce il messaggio formattato con il codice errore
	 * @return messaggio nel formato "[CODICE] messaggio"
	 */
	public String getFormattedMessage() {
		if (errorCode != null) {
			return ErrorMessageResolver.buildErrorMessage(errorCode, parameters);
		}
		return getMessage();
	}
}
