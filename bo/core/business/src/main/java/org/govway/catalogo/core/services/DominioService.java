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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.core.dao.specifications.DominioSpecification;
import org.govway.catalogo.core.dao.specifications.ReferenteDominioSpecification;
import org.govway.catalogo.core.exceptions.NotFoundException;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

@Service
public class DominioService extends AbstractService {

	public Page<DominioEntity> findAll(Specification<DominioEntity> spec, Pageable p) {
		return this.dominioRepo.findAll(spec, p);
	}

	public void delete(DominioEntity dominio) {
		this.dominioRepo.delete(dominio);
	}

	public boolean exists(UUID key) {
		return this.find(key).isPresent();
	}

	public Optional<DominioEntity> find(UUID key) {
		return this.dominioRepo.findOne(filterByKey(key));
	}

	public void save(DominioEntity dominio) {
		this.dominioRepo.save(dominio);
	}

	public boolean existsByNome(DominioEntity dominio) {
		return this.dominioRepo.findOne(filterByNome(dominio)).isPresent();
	}

	private Specification<DominioEntity> filterByKey(UUID key) {
		DominioSpecification dominioFilter = new DominioSpecification();
		dominioFilter.setIdDominio(Optional.of(key));
		return dominioFilter;
	}

	private Specification<DominioEntity> filterByNome(DominioEntity dominio) {
		DominioSpecification dominioFilter = new DominioSpecification();
		dominioFilter.setNome(Optional.of(dominio.getNome()));
		return dominioFilter;
	}
	
	public Page<ReferenteDominioEntity> findAllReferentiDominio(ReferenteDominioSpecification spec,
			Pageable pageable) {
		return this.referenteDominioRepo.findAll(spec, pageable);
	}


	public List<ReferenteDominioEntity> getReferenteDominio(UUID idDominio, UUID idUtente, TIPO_REFERENTE tipo) {
		
		ReferenteDominioSpecification spec = new ReferenteDominioSpecification();
		spec.setIdDominio(Optional.of(idDominio.toString()));
		spec.setIdUtente(Optional.of(idUtente.toString()));
		spec.setTipoReferente(Optional.ofNullable(tipo));
		
		List<ReferenteDominioEntity> findAll = this.referenteDominioRepo.findAll(spec);
		if(findAll.size() == 0) {
			throw new NotFoundException("Referente ["+idUtente+"] non trovato per dominio ["+idDominio+"] "+((tipo != null) ? "e tipo ["+tipo+"]" : ""));
		}
		
		return findAll;
	}

	public void deleteReferenteDominio(ReferenteDominioEntity entity) {
		entity.getDominio().getReferenti().remove(entity);
		this.referenteDominioRepo.delete(entity);
	}

	public void save(ReferenteDominioEntity referenteEntity) {
		this.referenteDominioRepo.save(referenteEntity);
	}



}
