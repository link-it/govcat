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
package org.govway.catalogo.cache;

import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AdesioneSpecification;
import org.govway.catalogo.core.orm.entity.ApiEntity;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.govway.catalogo.core.services.AdesioneService;
import org.govway.catalogo.core.services.ApiService;
import org.govway.catalogo.core.services.SoggettoService;
import org.govway.catalogo.exception.NotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;

public class CatalogoCache {

	@Autowired
	private ApiService apiService;
	
	@Autowired
	private SoggettoService soggettoService;
	
	@Autowired
	private AdesioneService adesioneService;
	
	private Logger logger = LoggerFactory.getLogger(CatalogoCache.class);

	private Cache<Long> cacheAdesioni;
	private Cache<Optional<SoggettoEntity>> cacheSoggetti;
	private Cache<Optional<ApiEntity>> cacheApi;

	public CatalogoCache(CacheConfiguration cacheConfiguration) {
		this.cacheAdesioni = new Cache<>(cacheConfiguration);
		this.cacheSoggetti = new Cache<>(cacheConfiguration);
		this.cacheApi = new Cache<>(cacheConfiguration);
	}
	
	public SoggettoEntity getSoggetto(String nome) {
		return this.findSoggetto(nome)			
				.orElseThrow(() -> new NotFoundException("Soggetto ["+nome+"] non trovato"));
	}

	public long countAdesioni(String idServizio, String idSoggetto) {
		
		String key = idServizio + "____" + idSoggetto;
		Optional<Long> opt = this.cacheAdesioni.get(key);
		
		if(opt.isPresent()) {
			this.logger.info("[CACHE] countAdesioni idServizio["+idServizio+"] idSoggetto["+idSoggetto+"]");
			return opt.get();
		}

		AdesioneSpecification spec = new AdesioneSpecification();
		spec.setIdServizio(Optional.of(UUID.fromString(idServizio)));
		spec.setIdSoggetto(Optional.of(UUID.fromString(idSoggetto)));
		
		Long cache = this.cacheAdesioni.cache(key, this.adesioneService.count(spec));
		this.logger.info("[NO CACHE] countAdesioni idServizio["+idServizio+"] idSoggetto["+idSoggetto+"]");
		return cache;
	}

	public Optional<SoggettoEntity> findSoggetto(String nome) {
		String key = nome;
		Optional<Optional<SoggettoEntity>> opt = this.cacheSoggetti.get(key);
		
		if(opt.isPresent()) {
			this.logger.info("[CACHE] findSoggetto nome["+nome+"]");
			return opt.get();
		}

		Optional<SoggettoEntity> cache = this.cacheSoggetti.cache(key, this.soggettoService.findByNome(nome));
		this.logger.info("[NO CACHE] findSoggetto nome["+nome+"]");
		return cache;
	}
	
	public Optional<ApiEntity> getApiEntity(String erogatore, String nomeApi, Integer versione) {
		
		String key = erogatore+ "____" + nomeApi + "____" + versione;
		
		Optional<Optional<ApiEntity>> opt = this.cacheApi.get(key);
		
		if(opt.isPresent()) {
			this.logger.info("[CACHE] getApiEntity erogatore["+erogatore+"] nome["+nomeApi+"] versione["+versione+"]");
			return opt.get();
		}

		Optional<SoggettoEntity> soggetto = this.findSoggetto(erogatore);
		
		if(!soggetto.isPresent()) {
			return Optional.empty();
		}
		
		Optional<ApiEntity> cache = this.cacheApi.cache(key, this.apiService.findByNomeVersioneSoggetto(nomeApi, versione, UUID.fromString(soggetto.get().getIdSoggetto())));
		this.logger.info("[NO CACHE] getApiEntity erogatore["+erogatore+"] nome["+nomeApi+"] versione["+versione+"]");
		return cache;
	}

}
