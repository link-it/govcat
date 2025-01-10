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

import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.springframework.data.jpa.domain.Specification;

public class OrganizzazioneSpecification implements Specification<OrganizzazioneEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idOrganizzazione = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<String> codice = Optional.empty();
	private Optional<String> codiceFiscale = Optional.empty();
	private Optional<String> tipo = Optional.empty();
	private Optional<Boolean> referente = Optional.empty();
	private Optional<Boolean> aderente = Optional.empty();
	private Optional<Boolean> esterna = Optional.empty();
	private Optional<Boolean> soggettoAderente = Optional.empty();

	public Optional<String> getCodice() {
		return codice;
	}

	public void setCodice(Optional<String> codice) {
		this.codice = codice;
	}

	public Optional<String> getCodiceFiscale() {
		return codiceFiscale;
	}

	public void setCodiceFiscale(Optional<String> codiceFiscale) {
		this.codiceFiscale = codiceFiscale;
	}

	public Optional<String> getTipo() {
		return tipo;
	}

	public void setTipo(Optional<String> tipo) {
		this.tipo = tipo;
	}

	public Optional<Boolean> getReferente() {
		return referente;
	}

	public void setReferente(Optional<Boolean> referente) {
		this.referente = referente;
	}

	public Optional<Boolean> getAderente() {
		return aderente;
	}

	public void setAderente(Optional<Boolean> aderente) {
		this.aderente = aderente;
	}

	public Optional<Boolean> getSoggettoAderente() {
		return soggettoAderente;
	}

	public void setSoggettoAderente(Optional<Boolean> soggettoAderente) {
		this.soggettoAderente = soggettoAderente;
	}

	@Override
	public Predicate toPredicate(Root<OrganizzazioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<OrganizzazioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(OrganizzazioneEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(OrganizzazioneEntity_.descrizione)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.nome), nome.get())); 
		}
		

		if (idOrganizzazione.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.idOrganizzazione), idOrganizzazione.get().toString())); 
		}
		
		if (codice.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.codiceEnte), codice.get())); 
		}
		
		if (codiceFiscale.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.codiceFiscaleSoggetto), codiceFiscale.get())); 
		}
		
		if (tipo.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.idTipoUtente), tipo.get())); 
		}
		
		if (referente.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.referente), referente.get())); 
		}
		
		if (aderente.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.aderente), aderente.get())); 
		}
		
		if (esterna.isPresent()) {
			predLst.add(cb.equal(root.get(OrganizzazioneEntity_.esterna), esterna.get())); 
		}
		
		if (soggettoAderente.isPresent()) {
			predLst.add(cb.equal(root.join(OrganizzazioneEntity_.soggetti).get(SoggettoEntity_.aderente), soggettoAderente.get()));
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdOrganizzazione() {
		return idOrganizzazione;
	}

	public void setIdOrganizzazione(Optional<UUID> idOrganizzazione) {
		this.idOrganizzazione = idOrganizzazione;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<Boolean> getEsterna() {
		return esterna;
	}

	public void setEsterna(Optional<Boolean> esterna) {
		this.esterna = esterna;
	}

}
