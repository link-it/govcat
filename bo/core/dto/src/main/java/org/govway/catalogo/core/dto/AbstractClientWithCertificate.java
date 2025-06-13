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

public abstract class AbstractClientWithCertificate extends DTOClient {
    private byte[] certificato;
    private String tipo;

    AbstractClientWithCertificate(String nomeClient, String descrizioneClient, String authTypeClient, 
                                         String indirizzoIpClient, byte[] certificato, String tipo) {
        super(nomeClient, descrizioneClient, authTypeClient, indirizzoIpClient);
        this.certificato = certificato;
        this.tipo = tipo;
    }

    public byte[] getCertificato() {
        return certificato;
    }

    public String getTipo() {
        return tipo;
    }
}