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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.PackageServizioEntity;
import org.govway.catalogo.core.orm.entity.PackageServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.springframework.data.jpa.domain.Specification;

public class PackageServizioSpecification implements Specification<PackageServizioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<UUID> idPackage = Optional.empty();
	private Optional<UUID> idComponente = Optional.empty();

	@Override
	public Predicate toPredicate(Root<PackageServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<PackageServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (idPackage.isPresent()) {
			predLst.add(cb.equal(root.join(PackageServizioEntity_._package).get(ServizioEntity_.idServizio), idPackage.get().toString()));
		}

		if (idComponente.isPresent()) {
			predLst.add(cb.equal(root.join(PackageServizioEntity_.servizio).get(ServizioEntity_.idServizio), idComponente.get().toString()));
		}

		return predLst;
	}

	public Optional<UUID> getIdComponente() {
		return idComponente;
	}

	public void setIdComponente(Optional<UUID> idComponente) {
		this.idComponente = idComponente;
	}

	public Optional<UUID> getIdPackage() {
		return idPackage;
	}

	public void setIdPackage(Optional<UUID> idPackage) {
		this.idPackage = idPackage;
	}
	
}
