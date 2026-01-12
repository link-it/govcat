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
	

	@Value("${org.govway.api.catalogo.resource.path:/var/govcat}")
	private String externalPath;

	private String tipoGatewayDefault = "ModI";
	private String tipoGatewayConfigurazione;
	private boolean tipoGatewayConfigurazioneLetto = false;

	private static final Logger logger = LoggerFactory.getLogger(SoggettoDTOFactory.class);

	private String getTipoGatewayConfigurazione() {
		if(!this.tipoGatewayConfigurazioneLetto) {
			try {
				ConfigurazioneReader confReader = new ConfigurazioneReader (externalPath);
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
	
	public String getNomeGateway(SoggettoEntity soggetto) {
		if (soggetto == null) return null;
		if (soggetto.getNomeGateway() == null)
			return soggetto.getNome();
		else 
			return soggetto.getNomeGateway();
	}

	public String getTipoGateway(SoggettoEntity soggetto) {
		if (soggetto == null) return null;

		if (soggetto.getTipoGateway() == null) {
			String tipoGatewayConf = this.getTipoGatewayConfigurazione();
			if(tipoGatewayConf != null) {
				return tipoGatewayConf;
			} else {
				return this.tipoGatewayDefault;
			}
		} else {
			return  soggetto.getTipoGateway();			
		}
	}

}