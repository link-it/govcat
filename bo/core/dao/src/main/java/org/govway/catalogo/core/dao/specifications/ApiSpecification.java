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
import javax.persistence.criteria.Join;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.*;
import org.govway.catalogo.core.orm.entity.ApiEntity.RUOLO;
import org.springframework.data.jpa.domain.Specification;

public class ApiSpecification implements Specification<ApiEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idApi = Optional.empty();
	private List<UUID> serviziList = null;
	private Optional<UUID> idSoggetto = Optional.empty();
	private Optional<RUOLO> ruolo = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<Integer> versione = Optional.empty();

	@Override
	public Predicate toPredicate(Root<ApiEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ApiEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(ApiEntity_.nome)), pattern));

            Join<ApiEntity, ApiConfigEntity> collaudoJoin   = root.join(ApiEntity_.collaudo, JoinType.LEFT);
            Join<ApiEntity, ApiConfigEntity> produzioneJoin = root.join(ApiEntity_.produzione, JoinType.LEFT);

            predLstQ.add(cb.like(cb.upper(collaudoJoin.get(ApiConfigEntity_.nomeGateway)), pattern));
            predLstQ.add(cb.like(cb.upper(produzioneJoin.get(ApiConfigEntity_.nomeGateway)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(ApiEntity_.nome), nome.get())); 
		}
		
		if (versione.isPresent()) {
			predLst.add(cb.equal(root.get(ApiEntity_.versione), versione.get())); 
		}

		if (idApi.isPresent()) {
			predLst.add(cb.equal(root.get(ApiEntity_.idApi), idApi.get().toString())); 
		}

		if(serviziList != null) {
			if(!serviziList.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(UUID servizio: serviziList) {
					preds2.add(cb.equal(root.join(ApiEntity_.servizi).get(ServizioEntity_.idServizio), servizio.toString())); 
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if (idSoggetto.isPresent()) {
			predLst.add(cb.equal(root.join(ApiEntity_.servizi).get(ServizioEntity_.dominio).get(DominioEntity_.soggettoReferente).get(SoggettoEntity_.idSoggetto), idSoggetto.get().toString())); 
		}
		
		if (ruolo.isPresent()) {
			predLst.add(cb.equal(root.get(ApiEntity_.ruolo), ruolo.get())); 
		}
		
		return predLst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdApi() {
		return idApi;
	}

	public void setIdApi(Optional<UUID> idApi) {
		this.idApi = idApi;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<Integer> getVersione() {
		return versione;
	}

	public void setVersione(Optional<Integer> versione) {
		this.versione = versione;
	}

	public Optional<RUOLO> getRuolo() {
		return ruolo;
	}

	public void setRuolo(Optional<RUOLO> ruolo) {
		this.ruolo = ruolo;
	}

	public Optional<UUID> getIdSoggetto() {
		return idSoggetto;
	}

	public void setIdSoggetto(Optional<UUID> idSoggetto) {
		this.idSoggetto = idSoggetto;
	}

	public List<UUID> getServiziList() {
		return serviziList;
	}

	public void setServiziList(List<UUID> serviziList) {
		this.serviziList = serviziList;
	}

}
