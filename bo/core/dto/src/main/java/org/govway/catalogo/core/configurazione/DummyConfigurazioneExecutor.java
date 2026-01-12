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
package org.govway.catalogo.core.configurazione;

import java.util.HashMap;
import java.util.Map;

import org.govway.catalogo.core.configurazione.AbstractEsitoConfigurazione.ESITO;
import org.govway.catalogo.core.dto.DTOAdesione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;


public class DummyConfigurazioneExecutor implements IConfigurazioneExecutor {
    private static final Logger logger = LoggerFactory.getLogger(DummyConfigurazioneExecutor.class);

	@Override
	public EsitoConfigurazioneAdesione configura(ConfigurazioneAdesioneInput adesioneInput) {

		EsitoConfigurazioneAdesione esito = new EsitoConfigurazioneAdesione();
		DTOAdesione a = adesioneInput.getAdesione();
		try {
//			logger.info(a.getAmbienteConfigurazione());
			//			logger.info(a.getClients());
			//			logger.info(a.getEstensioni());

			stampaCampi(a);
		} catch (JsonProcessingException e) {
			logger.info("errore :");
			e.printStackTrace();
		}
		esito.setEsito(ESITO.OK);
		esito.setMessaggioErrore("TUTTO OK");
		Map<String, String> map = new HashMap<>();
		map.put("chiave1", "valore1");
		map.put("chiave2", "valore2");
		map.put("chiave3", "valore3");
		map.put("chiave4", "valore4");

		esito.setChiaveRestituita(map);

		return esito;
	}

	public void stampaCampi(DTOAdesione a) throws JsonProcessingException {
		// Create ObjectMapper instance
		ObjectMapper objectMapper = new ObjectMapper();
		String json = null;
		// Serialize object to JSON
		json  = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(a);

		logger.info("stampa del contenuto del dto:");
		logger.info(json);
	}
}