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
package org.govway.catalogo.cache;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.govway.catalogo.gest.clients.govwaymonitor.PatchedApiClient;
import org.govway.catalogo.gest.clients.govwaymonitor.api.MonitoraggioApi;
import org.govway.catalogo.gest.clients.govwaymonitor.impl.ApiException;
import org.govway.catalogo.gest.clients.govwaymonitor.model.DiagnosticoSeveritaEnum;
import org.govway.catalogo.gest.clients.govwaymonitor.model.Evento;
import org.govway.catalogo.gest.clients.govwaymonitor.model.ListaEventi;
import org.govway.catalogo.monitoraggioutils.ConfigurazioneConnessione;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;

public class GovwayCache {

	private Logger logger = LoggerFactory.getLogger(GovwayCache.class);
	
	private Cache<List<Evento>> cacheEventi;

    @Value("${govway.query.limit}")
	private Integer limit;

	public GovwayCache(CacheConfiguration cacheConfiguration) {
		this.cacheEventi = new Cache<>(cacheConfiguration);
	}

	public List<Evento> findAllEventi(ConfigurazioneConnessione conf, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica, String tipo) throws ApiException {
		
		DateTimeFormatter dtf = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
		String key = conf.getAmbiente() + "___" + dataInizioVerifica.format(dtf) + "___" + dataFineVerifica.format(dtf) + "___" + tipo; 
		Optional<List<Evento>> opt = this.cacheEventi.get(key);
		
		if(opt.isPresent()) {
			this.logger.info("[CACHE] findAllEventi ambiente["+conf.getAmbiente()+"] dataInizio["+dataInizioVerifica.format(dtf)+"] dataFine["+dataFineVerifica.format(dtf)+"] tipo["+tipo+"]");
			return opt.get();
		}

		List<Evento> cache = this.cacheEventi.cache(key, this._findAllEventi(conf, dataInizioVerifica, dataFineVerifica, tipo));
		this.logger.info("[NO CACHE] findAllEventi ambiente["+conf.getAmbiente()+"] dataInizio["+dataInizioVerifica.format(dtf)+"] dataFine["+dataFineVerifica.format(dtf)+"] tipo["+tipo+"]");
		return cache;

	}
	
	private List<Evento> _findAllEventi(ConfigurazioneConnessione conf, OffsetDateTime dataInizioVerifica, OffsetDateTime dataFineVerifica, String tipo) throws ApiException {

		PatchedApiClient client = getClient(conf);
		MonitoraggioApi mon = new MonitoraggioApi(client);

		List<Evento> lst = new ArrayList<>();
		Integer offset = 0;
		ListaEventi resp = null;
		do {
			resp = mon.findAllEventi(dataInizioVerifica, dataFineVerifica, offset, limit, DiagnosticoSeveritaEnum.ERROR, tipo, "Violazione", null, null, null);
			lst.addAll(resp.getItems());
			offset += resp.getItems().size();
		} while (resp.getItems().size() > 0);

		return lst;
	}
	
	protected PatchedApiClient getClient(ConfigurazioneConnessione configurazioneConnessione) {
		PatchedApiClient client = new PatchedApiClient(
				Optional.ofNullable(configurazioneConnessione.getUsername()),
				Optional.ofNullable(configurazioneConnessione.getPassword())
				);		
		client.setDebugging(false);
		client.setBasePath(configurazioneConnessione.getUrl());
		return client;
	}

	
}
