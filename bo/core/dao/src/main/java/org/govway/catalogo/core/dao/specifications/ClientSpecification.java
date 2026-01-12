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

import org.govway.catalogo.core.orm.entity.AmbienteEnum;
import org.govway.catalogo.core.orm.entity.ClientEntity;
import org.govway.catalogo.core.orm.entity.ClientEntity.AuthType;
import org.govway.catalogo.core.orm.entity.ClientEntity.StatoEnum;
import org.govway.catalogo.core.orm.entity.ClientEntity_;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.springframework.data.jpa.domain.Specification;

public class ClientSpecification implements Specification<ClientEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idClient = Optional.empty();
	private Optional<UUID> idSoggetto = Optional.empty();
	private Optional<UUID> idOrganizzazione = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<StatoEnum> stato = Optional.empty();
	private Optional<AmbienteEnum> ambiente = Optional.empty();
	private Optional<AuthType> authType = Optional.empty();


	@Override
	public Predicate toPredicate(Root<ClientEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ClientEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			predLstQ.add(cb.like(cb.upper(root.get(ClientEntity_.nome)), "%" + q.get().toUpperCase() + "%")); 
			predLstQ.add(cb.like(cb.upper(root.get(ClientEntity_.descrizione)), "%" + q.get().toUpperCase() + "%"));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.nome), nome.get())); 
		}
		
		if (stato.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.stato), stato.get())); 
		}
		
		if (idSoggetto.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.soggetto).get(SoggettoEntity_.idSoggetto), idSoggetto.get().toString())); 
		}
		
		if (idOrganizzazione.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.soggetto).get(SoggettoEntity_.organizzazione).get(OrganizzazioneEntity_.idOrganizzazione), idOrganizzazione.get().toString())); 
		}
		
		if (idClient.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.idClient), idClient.get().toString())); 
		}
		
		if (ambiente.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.ambiente), ambiente.get())); 
		}
		
		if (authType.isPresent()) {
			predLst.add(cb.equal(root.get(ClientEntity_.authType), authType.get())); 
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdSoggetto() {
		return idSoggetto;
	}

	public void setIdSoggetto(Optional<UUID> idSoggetto) {
		this.idSoggetto = idSoggetto;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<UUID> getIdClient() {
		return idClient;
	}

	public void setIdClient(Optional<UUID> idClient) {
		this.idClient = idClient;
	}

	public Optional<AmbienteEnum> getAmbiente() {
		return ambiente;
	}

	public void setAmbiente(Optional<AmbienteEnum> ambiente) {
		this.ambiente = ambiente;
	}

	public Optional<AuthType> getAuthType() {
		return authType;
	}

	public void setAuthType(Optional<AuthType> authType) {
		this.authType = authType;
	}

	public Optional<StatoEnum> getStato() {
		return stato;
	}

	public void setStato(Optional<StatoEnum> stato) {
		this.stato = stato;
	}

	public Optional<UUID> getIdOrganizzazione() {
		return idOrganizzazione;
	}

	public void setIdOrganizzazione(Optional<UUID> idOrganizzazione) {
		this.idOrganizzazione = idOrganizzazione;
	}

}
