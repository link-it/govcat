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
package batch;

import java.io.IOException;

import org.govway.catalogo.core.business.utils.configurazione.ConfigurazioneReader;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

import com.jayway.jsonpath.JsonPath;

public class SoggettoDTOFactory {
	

	@Value("${org.govway.api.catalogo.configurazione.path:/var/govcat/conf/configurazione.json}")
	private String configurazioneJsonPath;

	private String tipoGatewayDefault = "ModI";
	private String tipoGatewayConfigurazione;
	private boolean tipoGatewayConfigurazioneLetto = false;

	private String profiloGatewayDefault;
	private boolean profiloGatewayDefaultLetto = false;

	private static final Logger logger = LoggerFactory.getLogger(SoggettoDTOFactory.class);

	private String getTipoGatewayConfigurazione() {
		if(!this.tipoGatewayConfigurazioneLetto) {
			try {
				ConfigurazioneReader confReader = new ConfigurazioneReader (configurazioneJsonPath);
				String json = confReader.getConfigurazione();
		        this.tipoGatewayConfigurazione = JsonPath.parse(json).read("$.monitoraggio.profilo_govway_default", String.class);
		        logger.debug("tipoGatewayConfigurazione: " + this.tipoGatewayConfigurazione);
			} catch(com.jayway.jsonpath.PathNotFoundException e) {
				logger.error("Errore nella lettura del tipo gateway dalla configurazione: " + e.getMessage(), e);
			} catch(IOException e) {
				logger.error("Errore nella lettura del tipo gateway dalla configurazione: " + e.getMessage(), e);
			}
			
			this.tipoGatewayConfigurazioneLetto = true;
		}
		
		return this.tipoGatewayConfigurazione;
	}
	
	public boolean isOrganizzazioneReferente(SoggettoEntity soggetto) {
		return soggetto != null
				&& soggetto.getOrganizzazione() != null
				&& soggetto.getOrganizzazione().isReferente();
	}

	public String getNomeGateway(SoggettoEntity soggetto) {
		if (soggetto == null) return null;
		if (soggetto.getNomeGateway() == null)
			return soggetto.getNome();
		else 
			return soggetto.getNomeGateway();
	}

	/**
	 * Profilo di interoperabilità di default dei soggetti (soggetto.profilo_gateway_default), la
	 * stessa chiave con cui govcat-api risolve il profilo di interoperabilità di un'API.
	 */
	private String getProfiloGatewayDefault() {
		if(!this.profiloGatewayDefaultLetto) {
			try {
				ConfigurazioneReader confReader = new ConfigurazioneReader(configurazioneJsonPath);
				this.profiloGatewayDefault = confReader.getProfiloGatewayDefaultSoggetto();
				logger.debug("profiloGatewayDefault: {}", this.profiloGatewayDefault);
			} catch(IOException e) {
				logger.error("Errore nella lettura del profilo gateway di default dalla configurazione: " + e.getMessage(), e);
			}

			this.profiloGatewayDefaultLetto = true;
		}

		return this.profiloGatewayDefault;
	}

	public String getTipoGateway(SoggettoEntity soggetto) {
		return this.getTipoGateway(soggetto, null);
	}

	/**
	 * Profilo di interoperabilità GovWay da usare per il soggetto, nell'ordine: tipo gateway del
	 * soggetto, profilo_govway dichiarato dai profili di autenticazione dell'adesione (Issue 354),
	 * soggetto.profilo_gateway_default, monitoraggio.profilo_govway_default, infine ModI.
	 *
	 * @param soggetto soggetto di cui ricavare il profilo
	 * @param profiloGovwayProfili profilo dichiarato dai profili di autenticazione, nullo se assente
	 *        o se i profili dell'adesione non concordano
	 */
	public String getTipoGateway(SoggettoEntity soggetto, String profiloGovwayProfili) {
		if (soggetto == null) return null;

		if (soggetto.getTipoGateway() != null) {
			return soggetto.getTipoGateway();
		}

		if (profiloGovwayProfili != null) {
			return profiloGovwayProfili;
		}

		String profiloGatewayDefaultConf = this.getProfiloGatewayDefault();
		if (profiloGatewayDefaultConf != null) {
			return profiloGatewayDefaultConf;
		}

		String tipoGatewayConf = this.getTipoGatewayConfigurazione();
		if (tipoGatewayConf != null) {
			return tipoGatewayConf;
		}

		return this.tipoGatewayDefault;
	}

}
