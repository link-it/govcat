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

import org.govway.catalogo.core.dao.specifications.GruppoSpecification;
import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class GruppoService extends AbstractService {

	public Page<GruppoEntity> findAll(Specification<GruppoEntity> spec, Pageable p) {
		return this.gruppoRepo.findAll(spec, p);
	}

	public void delete(GruppoEntity gruppo) {
		
		for(GruppoEntity g: gruppo.getFigli()) {
			this.delete(g);
		}

		for(ServizioEntity s: gruppo.getServizi()) {
			s.getGruppi().remove(gruppo);
			this.servizioRepo.save(s);
		}

		gruppo.getServizi().clear();
		
		this.gruppoRepo.delete(gruppo);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<GruppoEntity> find(UUID key) {
		return this.gruppoRepo.findOne(filterByKey(key));
	}

	public void save(GruppoEntity gruppo) {
		this.gruppoRepo.save(gruppo);
	}

	public boolean existsByNome(GruppoEntity gruppo) {
		return this.gruppoRepo.findOne(filterByNome(gruppo)).isPresent();
	}

	private Specification<GruppoEntity> filterByKey(UUID key) {
		GruppoSpecification gruppoFilter = new GruppoSpecification();
		gruppoFilter.setIdGruppo(Optional.of(key));
		return gruppoFilter;
	}

	private Specification<GruppoEntity> filterByNome(GruppoEntity gruppo) {
		GruppoSpecification gruppoFilter = new GruppoSpecification();
		gruppoFilter.setNome(Optional.of(gruppo.getNome()));
		return gruppoFilter;
	}

}
