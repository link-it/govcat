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
package org.govway.catalogo.services;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.ErrorCode;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * Verifica del criterio di univocita` delle api del catalogo.
 *
 * Il criterio e` nome + versione + soggetto referente del dominio del servizio. Per i servizi
 * INTERMEDIATI (fruizioni) fa parte del criterio anche l'ente erogatore, perche` sul gateway
 * l'identita` di una fruizione comprende il soggetto che eroga: due servizi intermediati sullo
 * stesso dominio possono quindi pubblicare la stessa api se gli enti erogatori sono diversi.
 *
 * Servizi intermediati e non intermediati ricadono in namespace distinti: la stessa api (nome,
 * versione, dominio) puo` esistere una volta su un servizio non intermediato e una volta su
 * ciascun servizio intermediato con ente erogatore diverso.
 */
@Service
public class ApiUnivocitaService {

	@Autowired
	private ApiService apiService;

	/**
	 * Verifica l'univocita` di nome/versione nel namespace del servizio indicato.
	 */
	public void checkUnivocita(String nome, Integer versione, ServizioEntity servizio) {
		checkUnivocita(nome, versione, servizio.getDominio().getSoggettoReferente(), servizio.isFruizione(), servizio.getSoggettoErogatore(), new ArrayList<>());
	}

	/**
	 * Verifica che tutte le api del servizio siano univoche nel namespace indicato: serve quando
	 * la modifica del servizio (dominio, flag di intermediazione o ente erogatore) le sposta in un
	 * namespace diverso da quello in cui erano state create.
	 *
	 * Le api del servizio sono escluse dal confronto, perche` non possono entrare in conflitto con
	 * se stesse.
	 */
	public void checkUnivocitaApiServizio(ServizioEntity servizio, SoggettoEntity soggettoReferente, boolean intermediato, SoggettoEntity soggettoErogatore) {
		List<ApiEntity> apiServizio = this.apiService.findByServizio(UUID.fromString(servizio.getIdServizio()));

		if(apiServizio.isEmpty()) {
			return;
		}

		List<UUID> idApiEscluse = apiServizio.stream()
				.map(api -> UUID.fromString(api.getIdApi()))
				.collect(Collectors.toList());

		for(ApiEntity api: apiServizio) {
			checkUnivocita(api.getNome(), api.getVersione(), soggettoReferente, intermediato, soggettoErogatore, idApiEscluse);
		}
	}

	/**
	 * Verifica l'univocita` di nome/versione in un namespace descritto esplicitamente: serve
	 * quando il namespace di destinazione non e` ancora quello dell'entita` (es. modifica di
	 * dominio, flag di intermediazione o ente erogatore di un servizio).
	 *
	 * @param idApiEscluse api da non considerare nel confronto, tipicamente quelle del servizio
	 *        che si sta modificando: non possono entrare in conflitto con se stesse.
	 */
	public void checkUnivocita(String nome, Integer versione, SoggettoEntity soggettoReferente, boolean intermediato, SoggettoEntity soggettoErogatore, List<UUID> idApiEscluse) {
		UUID idSoggettoReferente = UUID.fromString(soggettoReferente.getIdSoggetto());
		SoggettoEntity erogatore = intermediato ? soggettoErogatore : null;
		UUID idSoggettoErogatore = erogatore != null ? UUID.fromString(erogatore.getIdSoggetto()) : null;

		if(!this.apiService.existsApiInConflitto(nome, versione, idSoggettoReferente, intermediato, idSoggettoErogatore, idApiEscluse)) {
			return;
		}

		if(erogatore != null) {
			throw new ConflictException(ErrorCode.API_409_INTERMEDIATO, Map.of(
					"nome", nome,
					"versione", String.valueOf(versione),
					"soggetto", soggettoReferente.getNome(),
					"erogatore", erogatore.getNome()));
		}

		throw new ConflictException(ErrorCode.API_409, Map.of(
				"nome", nome,
				"versione", String.valueOf(versione),
				"soggetto", soggettoReferente.getNome()));
	}

}
