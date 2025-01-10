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

import org.govway.catalogo.core.orm.entity.DocumentoEntity;
import org.govway.catalogo.core.orm.entity.DocumentoEntity_;
import org.springframework.data.jpa.domain.Specification;

public class DocumentoSpecification implements Specification<DocumentoEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> uuid= Optional.empty();
	private Optional<Integer> versione = Optional.empty();

	@Override
	public Predicate toPredicate(Root<DocumentoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<DocumentoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if(uuid.isPresent()) {
			predLst.add(cb.equal(root.get(DocumentoEntity_.uuid), uuid.get())); 
		}
		if (versione.isPresent()) {
            predLst.add(cb.equal(root.get(DocumentoEntity_.versione), versione.get()));
        }
		
		return predLst;
	}

	public Optional<String> getUuid() {
		return uuid;
	}

	public void setUuid(Optional<String> uuid) {
		this.uuid = uuid;
	}
	public Optional<Integer> getVersione() {
		return versione;
	}

	public void setVersione(Optional<Integer> versione) {
		this.versione = versione;
	}
}
