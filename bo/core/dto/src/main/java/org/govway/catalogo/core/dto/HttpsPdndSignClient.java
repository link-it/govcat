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

import java.util.UUID;


public class HttpsPdndSignClient extends DTOClient {

    private byte[] outCertificate;
    private String outTipo;
    private byte[] signCertificate;
    private String signTipo;
    private UUID clientId;

    public HttpsPdndSignClient(String nomeClient, String descrizioneClient, String authTypeClient, String indirizzoIpClient,
    		byte[] outCertificate, String outTipo, byte[] signCertificate, String signTipo, UUID clientId) {
		super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient); 
    	this.outCertificate = outCertificate;
        this.outTipo = outTipo;
        this.signCertificate = signCertificate;
        this.signTipo = signTipo;
        this.clientId = clientId;
    }

    public byte[] getOutCertificate() {
        return outCertificate;
    }

    public String getOutTipo() {
        return outTipo;
    }

    public byte[] getSignCertificate() {
        return signCertificate;
    }

    public String getSignTipo() {
        return signTipo;
    }

    public UUID getClientId() {
        return clientId;
    }
}
