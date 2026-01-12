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

import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

public class ClasseUtenteSpecification implements Specification<ClasseUtenteEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<UUID> idClasseUtente = Optional.empty();

	@Override
	public Predicate toPredicate(Root<ClasseUtenteEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ClasseUtenteEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			predLstQ.add(cb.like(cb.upper(root.get(ClasseUtenteEntity_.nome)), "%" + q.get().toUpperCase() + "%")); 
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(ClasseUtenteEntity_.nome), nome.get())); 
		}
		
		if (idClasseUtente.isPresent()) {
			predLst.add(cb.equal(root.get(ClasseUtenteEntity_.idClasseUtente), idClasseUtente.get().toString())); 
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<UUID> getIdClasseUtente() {
		return idClasseUtente;
	}

	public void setIdClasseUtente(Optional<UUID> idClasseUtente) {
		this.idClasseUtente = idClasseUtente;
	}

}
