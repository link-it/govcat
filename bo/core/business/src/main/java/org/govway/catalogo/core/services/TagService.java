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

import org.govway.catalogo.core.dao.specifications.TagSpecification;
import org.govway.catalogo.core.orm.entity.TagEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class TagService extends AbstractService {

	public Page<TagEntity> findAll(Specification<TagEntity> spec, Pageable p) {
		return this.tagRepo.findAll(spec, p);
	}

	public void delete(TagEntity organization) {
		this.tagRepo.delete(organization);
	}

	public boolean exists(String key) {
		return this.find(key).isPresent();
	}

	public Optional<TagEntity> find(String key) {
		return this.tagRepo.findOne(filterByTag(key));
	}

	public void save(TagEntity organization) {
		this.tagRepo.save(organization);
	}

	private Specification<TagEntity> filterByTag(String nome) {
		TagSpecification organizationFilter = new TagSpecification();
		organizationFilter.setTag(Optional.of(nome));
		return organizationFilter;
	}

}
