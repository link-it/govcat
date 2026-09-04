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

import org.govway.catalogo.servlets.model.Configurazione;
import org.govway.catalogo.servlets.model.PdndVersionEnum;
import org.govway.catalogo.servlets.pdnd.client.api.GatewayApi;
import org.govway.catalogo.servlets.pdnd.client.api.HealthApi;
import org.govway.catalogo.servlets.pdnd.client.api.impl.ApiClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;

/**
 * Fornisce il client PDND da utilizzare per ciascun ambiente, in base alla versione
 * dell'API PDND indicata da {@code generale.pdnd_version} nella configurazione.
 *
 * Valori ammessi: {@code v1} (API Interoperability API Gateway v1) e {@code v3}
 * (API PDND core v3). In mancanza dell'indicazione si utilizza la v1.
 */
public class PDNDClientFactory {

	private static final PdndVersionEnum VERSIONE_DEFAULT = PdndVersionEnum.V1;

	private Logger logger = LoggerFactory.getLogger(PDNDClientFactory.class);

	@Autowired
	private Configurazione configurazione;

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

	/** Versione con cui sono stati costruiti i client, per riallinearli se la configurazione cambia. */
	private PdndVersionEnum versioneClient;

	public IPDNDClient getClientCollaudo() {
		if(this.clientCollaudo == null || isVersioneCambiata()) {
			resetClient();

			this.clientCollaudo = isVersioneV1()
					? new PDNDClient(new GatewayApi(this.apiClientCollaudo), new HealthApi(this.apiClientCollaudo))
					: new PDNDClientV3(new org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi(this.apiClientV3Collaudo));

			this.logger.debug("Client PDND ambiente [collaudo] versione [{}]", getVersione().getValue());
		}

		return this.clientCollaudo;
	}

	public IPDNDClient getClientProduzione() {
		if(this.clientProduzione == null || isVersioneCambiata()) {
			resetClient();

			this.clientProduzione = isVersioneV1()
					? new PDNDClient(new GatewayApi(this.apiClientProduzione), new HealthApi(this.apiClientProduzione))
					: new PDNDClientV3(new org.govway.catalogo.servlets.pdnd.v3.client.api.GatewayApi(this.apiClientV3Produzione));

			this.logger.debug("Client PDND ambiente [produzione] versione [{}]", getVersione().getValue());
		}

		return this.clientProduzione;
	}

	private boolean isVersioneCambiata() {
		return !getVersione().equals(this.versioneClient);
	}

	private void resetClient() {
		if(isVersioneCambiata()) {
			this.clientCollaudo = null;
			this.clientProduzione = null;
			this.versioneClient = getVersione();
		}
	}

	/**
	 * Restituisce la versione dell'API PDND configurata in {@code generale.pdnd_version},
	 * oppure la versione di default se non indicata.
	 */
	public PdndVersionEnum getVersione() {
		if(this.configurazione == null || this.configurazione.getGenerale() == null
				|| this.configurazione.getGenerale().getPdndVersion() == null) {
			return VERSIONE_DEFAULT;
		}

		return this.configurazione.getGenerale().getPdndVersion();
	}

	/**
	 * @return true se l'integrazione utilizza l'API PDND v1
	 */
	public boolean isVersioneV1() {
		return PdndVersionEnum.V1.equals(getVersione());
	}
}
