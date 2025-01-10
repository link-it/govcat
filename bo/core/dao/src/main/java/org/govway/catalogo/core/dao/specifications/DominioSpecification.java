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
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.springframework.data.jpa.domain.Specification;

public class DominioSpecification implements Specification<DominioEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<Boolean> deprecato = Optional.empty();
	private Optional<Boolean> esterno = Optional.empty();
	private Optional<UUID> idDominio = Optional.empty();
	private Optional<UUID> idSoggetto = Optional.empty();
	private Optional<String> idReferente = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<VISIBILITA> visibilita = Optional.empty();

	@Override
	public Predicate toPredicate(Root<DominioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<DominioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			predLstQ.add(cb.like(cb.upper(root.get(DominioEntity_.nome)), "%" + q.get().toUpperCase() + "%")); 
			predLstQ.add(cb.like(cb.upper(root.get(DominioEntity_.descrizione)), "%" + q.get().toUpperCase() + "%"));
			predLstQ.add(cb.like(cb.upper(root.get(DominioEntity_.soggettoReferente).get(SoggettoEntity_.nome)), "%" + q.get().toUpperCase() + "%"));
			predLstQ.add(cb.like(cb.upper(root.get(DominioEntity_.soggettoReferente).get(SoggettoEntity_.organizzazione).get(OrganizzazioneEntity_.nome)), "%" + q.get().toUpperCase() + "%"));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(DominioEntity_.nome), nome.get())); 
		}
		
		if (visibilita.isPresent()) {
			predLst.add(cb.equal(root.get(DominioEntity_.visibilita), visibilita.get()));
		}
		
		if (deprecato.isPresent()) {
			predLst.add(cb.equal(root.get(DominioEntity_.deprecato), deprecato.get())); 
		}
		
		if (esterno.isPresent()) {
			predLst.add(cb.equal(root.join(DominioEntity_.soggettoReferente).join(SoggettoEntity_.organizzazione).get(OrganizzazioneEntity_.esterna), esterno.get())); 
		}
		

		if (idDominio.isPresent()) {
			predLst.add(cb.equal(root.get(DominioEntity_.idDominio), idDominio.get().toString())); 
		}
		
		if (idSoggetto.isPresent()) {
			predLst.add(cb.equal(root.get(DominioEntity_.soggettoReferente).get(SoggettoEntity_.idSoggetto), idSoggetto.get().toString())); 
		}
		
		if(idReferente.isPresent()) {
			Path<String> joinedReferentIds = root.join(DominioEntity_.referenti).join(ReferenteDominioEntity_.referente).get(UtenteEntity_.idUtente);
			predLst.add(cb.literal(idReferente.get()).in(joinedReferentIds));
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

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<String> getIdReferente() {
		return idReferente;
	}

	public void setIdReferente(Optional<String> idReferente) {
		this.idReferente = idReferente;
	}

	public Optional<UUID> getIdSoggetto() {
		return idSoggetto;
	}

	public void setIdSoggetto(Optional<UUID> idSoggetto) {
		this.idSoggetto = idSoggetto;
	}

	public Optional<Boolean> getDeprecato() {
		return deprecato;
	}

	public void setDeprecato(Optional<Boolean> deprecato) {
		this.deprecato = deprecato;
	}

	public Optional<Boolean> getEsterno() {
		return esterno;
	}

	public void setEsterno(Optional<Boolean> esterno) {
		this.esterno = esterno;
	}

	public Optional<VISIBILITA> getVisibilita() {
		return visibilita;
	}

	public void setVisibilita(Optional<VISIBILITA> visibilita) {
		this.visibilita = visibilita;
	}

}
