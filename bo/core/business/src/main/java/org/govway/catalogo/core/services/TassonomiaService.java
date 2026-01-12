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

import org.govway.catalogo.core.dao.specifications.CategoriaSpecification;
import org.govway.catalogo.core.dao.specifications.TassonomiaSpecification;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class TassonomiaService extends AbstractService {

	public Page<TassonomiaEntity> findAll(Specification<TassonomiaEntity> spec, Pageable p) {
		return this.tassonomiaRepo.findAll(spec, p);
	}

	public void delete(TassonomiaEntity organization) {
		this.tassonomiaRepo.delete(organization);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<TassonomiaEntity> find(UUID key) {
		return this.tassonomiaRepo.findOne(filterByKey(key));
	}

	public void save(TassonomiaEntity organization) {
		this.tassonomiaRepo.save(organization);
	}

	private Specification<TassonomiaEntity> filterByKey(UUID key) {
		TassonomiaSpecification organizationFilter = new TassonomiaSpecification();
		organizationFilter.setIdTassonomia(Optional.of(key));
		return organizationFilter;
	}

	public Page<CategoriaEntity> findAllCategorie(Specification<CategoriaEntity> spec, Pageable p) {
		return this.categoriaRepo.findAll(spec, p);
	}

	public void delete(CategoriaEntity organization) {
		this.categoriaRepo.delete(organization);
	}

	public boolean existsCategoria(UUID idCategoria) {
		return this.categoriaRepo.count(getCategoriaKeySpec(idCategoria)) > 0;
	}

	private CategoriaSpecification  getCategoriaKeySpec(UUID idCategoria) {
		CategoriaSpecification spec = new CategoriaSpecification();
		spec.setIdCategoria(Optional.of(idCategoria));
		return spec;
	}
	public Optional<CategoriaEntity> findCategoria(UUID idCategoria) {
		return this.categoriaRepo.findOne(getCategoriaKeySpec(idCategoria));
	}

	public void save(CategoriaEntity organization) {
		this.categoriaRepo.save(organization);
	}

	public boolean existsByNome(String nome) {
		TassonomiaSpecification spec = new TassonomiaSpecification();
		spec.setNome(Optional.of(nome));
		return this.tassonomiaRepo.count(spec) > 0;
	}

	public boolean existsCategoriaByNome(UUID idTassonomia, String nome) {
		CategoriaSpecification spec = new CategoriaSpecification();
		spec.setIdTassonomia(Optional.of(idTassonomia));
		spec.setNome(Optional.of(nome));
		return this.categoriaRepo.count(spec) > 0;
	}




}
