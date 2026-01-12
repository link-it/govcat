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
package org.govway.catalogo.core.dao.specifications;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.MessaggioServizioEntity;
import org.govway.catalogo.core.orm.entity.MessaggioServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.springframework.data.jpa.domain.Specification;

public class MessaggioServizioSpecification implements Specification<MessaggioServizioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<UUID> uuid= Optional.empty();
	private Optional<String> q= Optional.empty();
	private Optional<UUID> idServizio= Optional.empty();
	

	@Override
	public Predicate toPredicate(Root<MessaggioServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<MessaggioServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(MessaggioServizioEntity_.oggetto)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(MessaggioServizioEntity_.testo)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		

		
		if(uuid.isPresent()) {
			predLst.add(cb.equal(root.get(MessaggioServizioEntity_.uuid), uuid.get().toString())); 
		}
		
		if(idServizio.isPresent()) {
			predLst.add(cb.equal(root.get(MessaggioServizioEntity_.servizio).get(ServizioEntity_.idServizio), idServizio.get().toString())); 
		}
		
		return predLst;
	}

	public Optional<UUID> getUuid() {
		return uuid;
	}

	public void setUuid(Optional<UUID> uuid) {
		this.uuid = uuid;
	}

	public Optional<UUID> getIdServizio() {
		return idServizio;
	}

	public void setIdServizio(Optional<UUID> idServizio) {
		this.idServizio = idServizio;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

}
