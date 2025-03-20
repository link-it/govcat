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
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Path;
import javax.persistence.criteria.Predicate;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity.STATO_CONFIGURAZIONE;
import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ClientAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ClientEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

public class AdesioneSpecification implements Specification<AdesioneEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private List<UUID> idAdesioni = null;
	private Optional<String> idLogico = Optional.empty();
	private Optional<UUID> idRichiedente = Optional.empty();
	private Optional<UUID> idServizio = Optional.empty();
	private Optional<UUID> idSoggetto = Optional.empty();
	private Optional<UUID> idOrganizzazione = Optional.empty();
	private Optional<UtenteEntity> utente = Optional.empty();
	private Optional<UUID> idReferente = Optional.empty();
	private Optional<UUID> gruppo = Optional.empty();
	private Optional<UUID> dominio = Optional.empty();
	private Optional<UUID> client = Optional.empty();
	private Optional<STATO_CONFIGURAZIONE> statoConfigurazione = Optional.empty();
	private List<String> stati = null;
	private List<String> tag = null;

	@Override
	public Predicate toPredicate(Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if(idReferente.isPresent()) {
			Path<UUID> joinedReferentIds = root.join(AdesioneEntity_.referenti).join(ReferenteAdesioneEntity_.referente).get(UtenteEntity_.idUtente);
			predLst.add(cb.literal(idReferente.get()).in(joinedReferentIds));
		}

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(AdesioneEntity_.servizio).get(ServizioEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(AdesioneEntity_.soggetto).get(SoggettoEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(AdesioneEntity_.soggetto).get(SoggettoEntity_.organizzazione).get(OrganizzazioneEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(AdesioneEntity_.idLogico)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.join(AdesioneEntity_.client, JoinType.LEFT).join(ClientAdesioneEntity_.client, JoinType.LEFT).get(ClientEntity_.nome)), pattern)); 
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}

		if(this.idAdesioni != null) {
			if(!this.idAdesioni.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(UUID idAdesione: this.idAdesioni) {
					preds2.add(cb.equal(root.get(AdesioneEntity_.idAdesione), idAdesione.toString()));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
			}
		}

		if (idLogico.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.idLogico), idLogico.get())); 
		}
		
		if (statoConfigurazione.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.statoConfigurazione), statoConfigurazione.get())); 
		}
		
		if (idServizio.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.servizio).get(ServizioEntity_.idServizio), idServizio.get().toString())); 
		}
		
		if (idRichiedente.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.richiedente).get(UtenteEntity_.idUtente), idRichiedente.get())); 
		}
		
		if (idSoggetto.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.soggetto).get(SoggettoEntity_.idSoggetto), idSoggetto.get().toString())); 
		}
		
		if (idOrganizzazione.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.soggetto).get(SoggettoEntity_.organizzazione).get(OrganizzazioneEntity_.idOrganizzazione), idOrganizzazione.get().toString())); 
		}
		
		if(gruppo.isPresent()) {
//			predLst.add(cb.equal(root.get(AdesioneEntity_.servizio).join(ServizioEntity_.gruppi, JoinType.LEFT).get(GruppoEntity_.idGruppo), gruppo.get().toString()));
		}
		
		if(dominio.isPresent()) {
			predLst.add(cb.equal(root.get(AdesioneEntity_.servizio).get(ServizioEntity_.dominio).get(DominioEntity_.idDominio), dominio.get().toString()));
		}
		
		if (client.isPresent()) {
			predLst.add(cb.equal(root.join(AdesioneEntity_.client).get(ClientAdesioneEntity_.client).get(ClientEntity_.idClient), client.get().toString())); 
		}
		
		if(this.utente.isPresent()) {
			
			UtenteEntity utente = this.utente.get();
			List<Predicate> predLstQ = new ArrayList<>();
			predLstQ.add(cb.equal(root.join(AdesioneEntity_.referenti, JoinType.LEFT).get(ReferenteAdesioneEntity_.referente), utente)); 
			predLstQ.add(cb.equal(root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.referenti, JoinType.LEFT).get(ReferenteServizioEntity_.referente), utente)); 
			predLstQ.add(cb.equal(root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).get(ReferenteDominioEntity_.referente), utente));
			predLstQ.add(cb.equal(root.get(AdesioneEntity_.richiedente), utente)); 
			predLstQ.add(cb.equal(root.get(AdesioneEntity_.servizio).get(ServizioEntity_.richiedente), utente)); 
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
			predLst.add(cb.notEqual(root.get(AdesioneEntity_.stato), "archiviato")); 
		}
		if(stati != null) {
			if(!stati.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(String stato: stati) {
					preds2.add(cb.equal(root.get(AdesioneEntity_.stato), stato));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				predLst.add(cb.disjunction());
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

	public Optional<UUID> getIdServizio() {
		return idServizio;
	}

	public void setIdServizio(Optional<UUID> idServizio) {
		this.idServizio = idServizio;
	}

	public Optional<UUID> getIdSoggetto() {
		return idSoggetto;
	}

	public void setIdSoggetto(Optional<UUID> idSoggetto) {
		this.idSoggetto = idSoggetto;
	}

	public Optional<UUID> getIdReferente() {
		return idReferente;
	}

	public void setIdReferente(Optional<UUID> idReferente) {
		this.idReferente = idReferente;
	}

	public Optional<UUID> getGruppo() {
		return gruppo;
	}

	public void setGruppo(Optional<UUID> gruppo) {
		this.gruppo = gruppo;
	}

	public Optional<UUID> getDominio() {
		return dominio;
	}

	public void setDominio(Optional<UUID> dominio) {
		this.dominio = dominio;
	}

	public List<String> getStati() {
		return stati;
	}

	public void setStati(List<String> stati) {
		this.stati = stati;
	}

	public List<String> getTag() {
		return tag;
	}

	public void setTag(List<String> tag) {
		this.tag = tag;
	}

	public static long getSerialversionuid() {
		return serialVersionUID;
	}

	public Optional<String> getIdLogico() {
		return idLogico;
	}

	public void setIdLogico(Optional<String> idLogico) {
		this.idLogico = idLogico;
	}

	public Optional<UUID> getClient() {
		return client;
	}

	public void setClient(Optional<UUID> client) {
		this.client = client;
	}

	public Optional<UUID> getIdOrganizzazione() {
		return idOrganizzazione;
	}

	public void setIdOrganizzazione(Optional<UUID> idOrganizzazione) {
		this.idOrganizzazione = idOrganizzazione;
	}

	public Optional<UtenteEntity> getUtente() {
		return utente;
	}

	public void setUtente(Optional<UtenteEntity> utente) {
		this.utente = utente;
	}

	public Optional<UUID> getIdRichiedente() {
		return idRichiedente;
	}

	public void setIdRichiedente(Optional<UUID> idRichiedente) {
		this.idRichiedente = idRichiedente;
	}

	public List<UUID> getIdAdesioni() {
		return idAdesioni;
	}

	public void setIdAdesioni(List<UUID> idAdesioni) {
		this.idAdesioni = idAdesioni;
	}

	public Optional<STATO_CONFIGURAZIONE> getStatoConfigurazione() {
		return statoConfigurazione;
	}

	public void setStatoConfigurazione(Optional<STATO_CONFIGURAZIONE> statoConfigurazione) {
		this.statoConfigurazione = statoConfigurazione;
	}

}
