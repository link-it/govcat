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
package org.govway.catalogo.core.services;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AllegatoApiSpecification;
import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class ApiService extends AbstractService {

	public Page<ApiEntity> findAll(Specification<ApiEntity> spec, Pageable p) {
		return this.apiRepo.findAll(spec, p);
	}

	public void delete(ApiEntity entity) {
		this.apiRepo.delete(entity);
		entity.getServizi().stream().forEach(s -> {
			s.getApi().remove(entity);
		});
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<ApiEntity> find(UUID key) {
		return this.apiRepo.findOne(filterByKey(key));
	}

	public void save(ApiEntity entity) {
		this.apiRepo.save(entity);
	}

	private Specification<ApiEntity> filterByKey(UUID key) {
		ApiSpecification specification = new ApiSpecification();
		specification.setIdApi(Optional.of(key));
		return specification;
	}

	private Specification<ApiEntity> filterByNomeVersione(String nome, Integer versione, UUID soggetto) {
		ApiSpecification specification = new ApiSpecification();
		specification.setNome(Optional.of(nome));
		specification.setVersione(Optional.of(versione));
		specification.setIdSoggetto(Optional.of(soggetto));
		return specification;
	}

	/**
	 * Verifica se esiste gia` una api con lo stesso nome e versione nello stesso "namespace" di
	 * univocita`.
	 *
	 * Il namespace e` dato da nome + versione + soggetto referente del dominio; per i servizi
	 * intermediati comprende anche l'ente erogatore. Servizi intermediati e non intermediati
	 * ricadono quindi in namespace distinti: la stessa api puo` esistere su un servizio non
	 * intermediato e, contemporaneamente, su servizi intermediati con enti erogatori diversi.
	 *
	 * @param idSoggettoErogatore ente erogatore del servizio intermediato; se null i servizi
	 *        intermediati privi di ente erogatore formano un namespace a se`. Ignorato se
	 *        intermediato e` false.
	 * @param idApiEscluse api da non considerare nel confronto (tipicamente quelle del servizio
	 *        che si sta modificando, che non possono entrare in conflitto con se stesse).
	 */
	public boolean existsApiInConflitto(String nome, Integer versione, UUID idSoggettoReferente, boolean intermediato, UUID idSoggettoErogatore, List<UUID> idApiEscluse) {
		ApiSpecification specification = new ApiSpecification();
		specification.setNome(Optional.of(nome));
		specification.setVersione(Optional.of(versione));
		specification.setIdSoggetto(Optional.of(idSoggettoReferente));
		specification.setServizioIntermediato(Optional.of(intermediato));

		if(intermediato) {
			specification.setIdSoggettoErogatore(Optional.ofNullable(idSoggettoErogatore));
		}

		specification.setIdApiEscluse(idApiEscluse);

		return this.apiRepo.count(specification) > 0;
	}

	/**
	 * Api associate al servizio indicato.
	 *
	 * Interroga il database invece di usare la collection dell'entita`: api_servizi ha due lati
	 * owning (ApiEntity.servizi e ServizioEntity.api), quindi la collection del servizio puo`
	 * risultare non aggiornata nella sessione corrente.
	 */
	public List<ApiEntity> findByServizio(UUID idServizio) {
		ApiSpecification specification = new ApiSpecification();
		specification.setServiziList(List.of(idServizio));
		return this.apiRepo.findAll(specification);
	}

	/**
	 * Risolve una api a partire dai dati provenienti dal gateway (nome, versione, soggetto).
	 *
	 * Il criterio di univocita` delle api distingue i servizi intermediati per ente erogatore,
	 * quindi questa ricerca puo` restituire piu` di un risultato: in quel caso la scelta e`
	 * deterministica (prima le api dei servizi non intermediati, poi id crescente) per non
	 * dipendere dall'ordinamento del database.
	 */
	public Optional<ApiEntity> findByNomeVersioneSoggetto(String nome, Integer versione, UUID soggetto) {
		List<ApiEntity> apiList = this.apiRepo.findAll(filterByNomeVersione(nome, versione, soggetto));

		if(apiList.isEmpty()) {
			return Optional.empty();
		}

		return apiList.stream()
				.min(Comparator.comparing(ApiService::isIntermediata)
						.thenComparing(ApiEntity::getId));
	}

	private static Boolean isIntermediata(ApiEntity api) {
		return api.getServizi().stream().anyMatch(ServizioEntity::isFruizione);
	}

	public Page<AllegatoApiEntity> findAllAllegatiApi(Specification<AllegatoApiEntity> spec, Pageable p) {
		return this.allegatoApiRepo.findAll(spec, p);
	}
	
	public Optional<AllegatoApiEntity> findAllegatoApi(UUID idApi, UUID idAllegato) {
		AllegatoApiSpecification spec = new AllegatoApiSpecification();
		spec.setIdApi(Optional.of(idApi));
		spec.setUuid(Optional.of(idAllegato));
		return this.allegatoApiRepo.findOne(spec);
	}
	
	public void save(AllegatoApiEntity entity) {
		this.allegatoApiRepo.save(entity);
	}

	public void delete(AllegatoApiEntity entity) {
		this.allegatoApiRepo.delete(entity);
	}


}
