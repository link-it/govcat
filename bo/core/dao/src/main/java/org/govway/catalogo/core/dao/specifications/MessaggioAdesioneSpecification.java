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
package org.govway.catalogo.core.dao.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity;
import org.govway.catalogo.core.orm.entity.MessaggioAdesioneEntity_;
import org.springframework.data.jpa.domain.Specification;

public class MessaggioAdesioneSpecification implements Specification<MessaggioAdesioneEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> uuid= Optional.empty();
	private Optional<String> q= Optional.empty();
	private Optional<String> idAdesione= Optional.empty();
	

	@Override
	public Predicate toPredicate(Root<MessaggioAdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<MessaggioAdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(MessaggioAdesioneEntity_.oggetto)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(MessaggioAdesioneEntity_.testo)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		

		
		if(uuid.isPresent()) {
			predLst.add(cb.equal(root.get(MessaggioAdesioneEntity_.uuid), uuid.get())); 
		}
		
		if(idAdesione.isPresent()) {
			predLst.add(cb.equal(root.get(MessaggioAdesioneEntity_.adesione).get(AdesioneEntity_.idAdesione), idAdesione.get())); 
		}
		
		return predLst;
	}

	public Optional<String> getUuid() {
		return uuid;
	}

	public void setUuid(Optional<String> uuid) {
		this.uuid = uuid;
	}

	public Optional<String> getIdAdesione() {
		return idAdesione;
	}

	public void setIdAdesione(Optional<String> idAdesione) {
		this.idAdesione = idAdesione;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

}
