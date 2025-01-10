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

import org.govway.catalogo.core.dao.specifications.NotificaSpecification;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class NotificaService extends AbstractService {

	public Page<NotificaEntity> findAll(Specification<NotificaEntity> spec, Pageable p) {
		return this.notificaRepo.findAll(spec, p);
	}

	public long count(Specification<NotificaEntity> spec) {
		return this.notificaRepo.count(spec);
	}

	public void delete(NotificaEntity entity) {
		this.notificaRepo.delete(entity);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<NotificaEntity> find(UUID key) {
		return this.notificaRepo.findOne(filterByKey(key));
	}

	public void save(NotificaEntity entity) {
		this.notificaRepo.save(entity);
	}

	private Specification<NotificaEntity> filterByKey(UUID key) {
		NotificaSpecification specification = new NotificaSpecification();
		specification.setIdNotifica(Optional.of(key));
		return specification;
	}

}
