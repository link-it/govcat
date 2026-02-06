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
package org.govway.catalogo.core.dto;

public class DTOSoggetto {

	private String nomeGateway;
	private String tipoGateway;

	public DTOSoggetto(String nomeGateway,String tipoGateway) {
		this.nomeGateway = nomeGateway;
		this.tipoGateway = tipoGateway;
	}

	public String getNomeGateway() {
		return nomeGateway;
	}
	public String getTipoGateway() {
		return tipoGateway;
	}
}