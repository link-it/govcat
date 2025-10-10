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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.GruppoEntity;
import org.govway.catalogo.core.orm.entity.GruppoEntity_;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.springframework.data.jpa.domain.Specification;

public class GruppoSpecification implements Specification<GruppoEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idGruppo = Optional.empty();
	private Optional<UUID> idGruppoPadre = Optional.empty();
	private Optional<Boolean> gruppoPadreNull = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<TipoServizio> tipo = Optional.empty();

	@Override
	public Predicate toPredicate(Root<GruppoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<GruppoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			predLstQ.add(cb.like(cb.upper(root.get(GruppoEntity_.nome)), "%" + q.get().toUpperCase() + "%")); 
			predLstQ.add(cb.like(cb.upper(root.get(GruppoEntity_.descrizione)), "%" + q.get().toUpperCase() + "%"));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(GruppoEntity_.nome), nome.get())); 
		}
		
		if (tipo.isPresent()) {
			predLst.add(cb.equal(root.get(GruppoEntity_.tipo), tipo.get()));
		}
		

		if (idGruppo.isPresent()) {
			predLst.add(cb.equal(root.get(GruppoEntity_.idGruppo), idGruppo.get().toString())); 
		}
		
		if (idGruppoPadre.isPresent()) {
			predLst.add(cb.equal(root.get(GruppoEntity_.gruppoPadre).get(GruppoEntity_.idGruppo), idGruppoPadre.get().toString())); 
		}
		
		if (gruppoPadreNull.isPresent()) {
			if(gruppoPadreNull.get()) {
				predLst.add(cb.isNull(root.get(GruppoEntity_.gruppoPadre))); 
			} else {
				predLst.add(cb.isNotNull(root.get(GruppoEntity_.gruppoPadre)));
			}
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdGruppo() {
		return idGruppo;
	}

	public void setIdGruppo(Optional<UUID> idGruppo) {
		this.idGruppo = idGruppo;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<UUID> getIdGruppoPadre() {
		return idGruppoPadre;
	}

	public void setIdGruppoPadre(Optional<UUID> idGruppoPadre) {
		this.idGruppoPadre = idGruppoPadre;
	}

	public Optional<Boolean> getGruppoPadreNull() {
		return gruppoPadreNull;
	}

	public void setGruppoPadreNull(Optional<Boolean> gruppoPadreNull) {
		this.gruppoPadreNull = gruppoPadreNull;
	}

	public Optional<TipoServizio> getTipo() {
		return tipo;
	}

	public void setTipo(Optional<TipoServizio> tipo) {
		this.tipo = tipo;
	}

}
