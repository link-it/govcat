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
package org.govway.catalogo.pdnd.controllers;

import java.util.Map;

import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.servlets.pdnd.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.client.api.HealthApi;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;

/**
 * Fornisce il client PDND da utilizzare per ciascun ambiente, in base alla versione
 * dell'API PDND configurata tramite la proprieta' {@code pdnd.versione}.
 *
 * Valori ammessi: {@code v3} (default, API PDND core v3) e {@code v1}
 * (API Interoperability API Gateway v1, deprecata).
 */
public class PDNDClientFactory {

	public static final String VERSIONE_V1 = "v1";
	public static final String VERSIONE_V3 = "v3";

	private Logger logger = LoggerFactory.getLogger(PDNDClientFactory.class);

	@Value("${pdnd.versione:v3}")
	private String versione;

	@Autowired
	@Qualifier("PDNDClientCollaudo")
	private ApiClient apiClientCollaudo;

	@Autowired
	@Qualifier("PDNDClientProduzione")
	private ApiClient apiClientProduzione;

	@Autowired
	@Qualifier("PDNDClientV3Collaudo")
	private org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiClient apiClientV3Collaudo;

	@Autowired
	@Qualifier("PDNDClientV3Produzione")
	private org.govway.catalogo.servlets.pdnd.v3.client.api.impl.ApiClient apiClientV3Produzione;

	private IPDNDClient clientCollaudo;
	private IPDNDClient clientProduzione;

	public IPDNDClient getClientCollaudo() {
		if(this.clientCollaudo == null) {
			this.clientCollaudo = isVersioneV1()
					? new PDNDClient(new GatewayApi(this.apiClientCollaudo), new HealthApi(this.apiClientCollaudo))
					: new PDNDClientV3(new org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi(this.apiClientV3Collaudo));

			this.logger.debug("Client PDND ambiente [collaudo] versione [{}]", getVersione());
		}

		return this.clientCollaudo;
	}

	public IPDNDClient getClientProduzione() {
		if(this.clientProduzione == null) {
			this.clientProduzione = isVersioneV1()
					? new PDNDClient(new GatewayApi(this.apiClientProduzione), new HealthApi(this.apiClientProduzione))
					: new PDNDClientV3(new org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi(this.apiClientV3Produzione));

			this.logger.debug("Client PDND ambiente [produzione] versione [{}]", getVersione());
		}

		return this.clientProduzione;
	}

	/**
	 * Restituisce la versione dell'API PDND configurata, validandone il valore.
	 */
	public String getVersione() {
		if(VERSIONE_V1.equalsIgnoreCase(this.versione)) {
			return VERSIONE_V1;
		}

		if(VERSIONE_V3.equalsIgnoreCase(this.versione)) {
			return VERSIONE_V3;
		}

		throw new InternalException(ErrorCode.SYS_500_CONFIG, Map.of("dettagli",
				"valore ["+this.versione+"] non ammesso per la proprieta' [pdnd.versione], attesi ["
						+VERSIONE_V1+", "+VERSIONE_V3+"]"));
	}

	private boolean isVersioneV1() {
		return VERSIONE_V1.equals(getVersione());
	}
}
