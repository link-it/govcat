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
import java.util.UUID;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.TassonomiaEntity;
import org.govway.catalogo.core.orm.entity.TassonomiaEntity_;
import org.springframework.data.jpa.domain.Specification;

public class TassonomiaSpecification implements Specification<TassonomiaEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<Boolean> visibile = Optional.empty();
	private Optional<Boolean> obbligatorio = Optional.empty();
	private Optional<UUID> idTassonomia = Optional.empty();

	@Override
	public Predicate toPredicate(Root<TassonomiaEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<TassonomiaEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(TassonomiaEntity_.descrizione)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(TassonomiaEntity_.nome)), pattern)); 
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (idTassonomia.isPresent()) {
			predLst.add(cb.equal(root.get(TassonomiaEntity_.idTassonomia), idTassonomia.get().toString())); 
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(TassonomiaEntity_.nome), nome.get())); 
		}
		
		if (visibile.isPresent()) {
			predLst.add(cb.equal(root.get(TassonomiaEntity_.visibile), visibile.get())); 
		}
		
		if (obbligatorio.isPresent()) {
			predLst.add(cb.equal(root.get(TassonomiaEntity_.obbligatorio), obbligatorio.get())); 
		}
		

		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdTassonomia() {
		return idTassonomia;
	}

	public void setIdTassonomia(Optional<UUID> idTassonomia) {
		this.idTassonomia = idTassonomia;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<Boolean> getObbligatorio() {
		return obbligatorio;
	}

	public void setObbligatorio(Optional<Boolean> obbligatorio) {
		this.obbligatorio = obbligatorio;
	}

	public Optional<Boolean> getVisibile() {
		return visibile;
	}

	public void setVisibile(Optional<Boolean> visibile) {
		this.visibile = visibile;
	}

}
