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

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.DocumentoSpecification;
import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class DocumentoService extends AbstractService {

	public Page<DocumentoEntity> findAll(Specification<DocumentoEntity> spec, Pageable p) {
		return this.documentoRepo.findAll(spec, p);
	}

	public void delete(DocumentoEntity organization) {
		this.documentoRepo.delete(organization);
	}

	public boolean exists(String key) {
		return this.find(key).isPresent();
	}

	public Optional<DocumentoEntity> find(String key) {
		List<DocumentoEntity> docs = this.findAll(key);
		return docs.stream()
	               .max(Comparator.comparing(DocumentoEntity::getVersione));
		//return docs.stream().findAny();
	}
	
	public Optional<DocumentoEntity> findDocumentoByUuidAndVersion(String uuid, int versione) {
	    return this.documentoRepo.findByUuidAndVersione(uuid, versione);
	}
	
	public List<DocumentoEntity> findAll(String key) {
		return this.documentoRepo.findAll(filterByKey(key));
	}

	public void save(DocumentoEntity organization) {
		this.documentoRepo.save(organization);
	}

	private Specification<DocumentoEntity> filterByKey(String key) {
		DocumentoSpecification organizationFilter = new DocumentoSpecification();
		organizationFilter.setUuid(Optional.of(key));
		return organizationFilter;
	}


}
