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

import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

public class ReferenteDominioSpecification implements Specification<ReferenteDominioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idDominio = Optional.empty();
	private Optional<String> idUtente = Optional.empty();
	private Optional<TIPO_REFERENTE> tipoReferente = Optional.empty();
	

	@Override
	public Predicate toPredicate(Root<ReferenteDominioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ReferenteDominioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(ReferenteDominioEntity_.referente).get(UtenteEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(ReferenteDominioEntity_.referente).get(UtenteEntity_.cognome)), pattern)); 
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (idDominio.isPresent()) {
			predLst.add(cb.equal(root.get(ReferenteDominioEntity_.dominio).get(DominioEntity_.idDominio), idDominio.get().toString())); 
		}
		
		if (idUtente.isPresent()) {
			predLst.add(cb.equal(root.get(ReferenteDominioEntity_.referente).get(UtenteEntity_.idUtente), idUtente.get())); 
		}
		

		if (tipoReferente.isPresent()) {
			predLst.add(cb.equal(root.get(ReferenteDominioEntity_.tipo), tipoReferente.get()));
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdDominio() {
		return idDominio;
	}

	public void setIdDominio(Optional<UUID> idDominio) {
		this.idDominio = idDominio;
	}

	public Optional<TIPO_REFERENTE> getTipoReferente() {
		return tipoReferente;
	}

	public void setTipoReferente(Optional<TIPO_REFERENTE> tipoReferente) {
		this.tipoReferente = tipoReferente;
	}

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public Optional<String> getIdUtente() {
		return idUtente;
	}

	public void setIdUtente(Optional<String> idUtente) {
		this.idUtente = idUtente;
	}

}
