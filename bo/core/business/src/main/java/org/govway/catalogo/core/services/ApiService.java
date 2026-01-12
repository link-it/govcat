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

import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.AllegatoApiSpecification;
import org.govway.catalogo.core.dao.specifications.ApiSpecification;
import org.govway.catalogo.core.orm.entity.AllegatoApiEntity;
import org.govway.catalogo.core.orm.entity.ApiEntity;
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

	public boolean existsByNomeVersioneSoggetto(String nome, Integer versione, UUID soggetto) {
		return this.apiRepo.count(filterByNomeVersione(nome, versione, soggetto)) > 0;
	}

	public Optional<ApiEntity> findByNomeVersioneSoggetto(String nome, Integer versione, UUID soggetto) {
		return this.apiRepo.findOne(filterByNomeVersione(nome, versione, soggetto));
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
