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
package org.govway.catalogo.core.dto;

import java.util.UUID;

public class HttpsPdndClient extends DTOClient {

	private byte[] certificate;
	private String tipo;
	private UUID clientId;

	public HttpsPdndClient(String nomeClient, String descrizioneClient, String authTypeClient, String indirizzoIpClient, 
			byte[] certificate, String tipo, UUID clientId) {
		super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient); 
		this.certificate = certificate;
		this.tipo = tipo;
		this.clientId = clientId;
	}

	public byte[] getOutCertificate() {
		return certificate;
	}

	public String getOutTipo() {
		return tipo;
	}

	public UUID getClientId() {
		return clientId;
	}
}
