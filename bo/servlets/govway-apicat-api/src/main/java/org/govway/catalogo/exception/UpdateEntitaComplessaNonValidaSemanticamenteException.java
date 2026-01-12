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

import java.util.List;

import org.govway.catalogo.servlets.model.EntitaComplessaError;

public class UpdateEntitaComplessaNonValidaSemanticamenteException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private List<EntitaComplessaError> errori;

	public UpdateEntitaComplessaNonValidaSemanticamenteException(String message, List<EntitaComplessaError> errori) {
		super(message);
		this.setErrori(errori);
	}
	
	public UpdateEntitaComplessaNonValidaSemanticamenteException(Throwable t, List<EntitaComplessaError> errori) {
		super(t);
		this.setErrori(errori);
	}

	public List<EntitaComplessaError> getErrori() {
		return errori;
	}

	public void setErrori(List<EntitaComplessaError> errori) {
		this.errori = errori;
	}
}
