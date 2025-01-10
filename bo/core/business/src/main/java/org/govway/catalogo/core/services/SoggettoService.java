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
package org.govway.catalogo.core.services;

import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.SoggettoSpecification;
import org.govway.catalogo.core.orm.entity.SoggettoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class SoggettoService extends AbstractService {

	public Page<SoggettoEntity> findAll(Specification<SoggettoEntity> spec, Pageable p) {
		return this.soggettoRepo.findAll(spec, p);
	}

	public void delete(SoggettoEntity entity) {
		this.soggettoRepo.delete(entity);
	}

	public boolean exists(SoggettoEntity entity) {
		return this.soggettoRepo.findOne(filterByKey(entity)).isPresent();
	}

	public Optional<SoggettoEntity> find(UUID key) {
		return this.soggettoRepo.findOne(filterByKey(key));
	}

	public void save(SoggettoEntity entity) {
		this.soggettoRepo.save(entity);
	}

	public boolean existsByNome(SoggettoEntity entity) {
		return this.soggettoRepo.findOne(filterByNome(entity)).isPresent();
	}

	public boolean existsByNome(String nome) {
		return this.findByNome(nome).isPresent();
	}

	public Optional<SoggettoEntity> findByNome(String nome) {
		SoggettoSpecification entityFilter = new SoggettoSpecification();
		entityFilter.setNome(Optional.of(nome));
		return this.soggettoRepo.findOne(entityFilter);
	}

	private Specification<SoggettoEntity> filterByKey(UUID key) {
		SoggettoSpecification entityFilter = new SoggettoSpecification();
		entityFilter.setIdSoggetto(Optional.of(key));
		return entityFilter;
	}

	private Specification<SoggettoEntity> filterByKey(SoggettoEntity entity) {
		SoggettoSpecification entityFilter = new SoggettoSpecification();
		entityFilter.setIdSoggetto(Optional.of(UUID.fromString(entity.getIdSoggetto())));
		return entityFilter;
	}

	private Specification<SoggettoEntity> filterByNome(SoggettoEntity entity) {
		SoggettoSpecification entityFilter = new SoggettoSpecification();
		entityFilter.setNome(Optional.of(entity.getNome()));
		return entityFilter;
	}

}
