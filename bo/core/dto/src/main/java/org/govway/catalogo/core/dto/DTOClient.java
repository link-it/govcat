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

public class DTOClient{
	private String nome;

	private String descrizione;

	private String authType;

	private String indirizzoIp;

	DTOClient(String nome,String descrizione,String authType,String indirizzoIp ) {
		this.nome = nome;
		this.descrizione = descrizione;
		this.authType = authType;
		this.indirizzoIp= indirizzoIp;
	}
	public String getNome() {
		return nome;
	}
	public String getDescrizione() {
		return descrizione;
	}

	public String getAuthType() {
		return authType;
	}
	public String getIndirizzoIp() {
		return indirizzoIp;
	}

}
