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
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Ruolo;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.springframework.data.jpa.domain.Specification;

public class UtenteSpecification implements Specification<UtenteEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<String> idUtente = Optional.empty();
	private Optional<String> nome = Optional.empty();
	private Optional<Stato> stato = Optional.empty();
	private Optional<UUID> idOrganizzazione = Optional.empty();
	private List<ClasseUtenteEntity> idClassiUtente = null;
	private Optional<String> email = Optional.empty();
	private Optional<String> emailAziendale = Optional.empty();
	private Optional<String> principal = Optional.empty();
	private Optional<String> principalLike = Optional.empty();
	private List<Ruolo> ruoli = null;
	private Optional<Boolean> ruoloNull = Optional.empty();
	private Optional<Boolean> referenteTecnico = Optional.empty();

	@Override
	public Predicate toPredicate(Root<UtenteEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<UtenteEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String qUpper = q.get().toUpperCase();
			predLstQ.add(cb.like(cb.upper(root.get(UtenteEntity_.principal)), "%" + qUpper + "%"));
			predLstQ.add(cb.like(cb.upper(root.get(UtenteEntity_.nome)), "%" + qUpper + "%"));
			predLstQ.add(cb.like(cb.upper(root.get(UtenteEntity_.cognome)), "%" + qUpper + "%"));
			predLstQ.add(cb.like(cb.upper(root.join(UtenteEntity_.organizzazione, JoinType.LEFT).get(OrganizzazioneEntity_.nome)), "%" + qUpper + "%"));
			// Ricerca per nome + cognome combinati (es. "Mario Rossi")
			predLstQ.add(cb.like(cb.upper(cb.concat(cb.concat(root.get(UtenteEntity_.nome), " "), root.get(UtenteEntity_.cognome))), "%" + qUpper + "%"));
			// Ricerca per cognome + nome combinati (es. "Rossi Mario")
			predLstQ.add(cb.like(cb.upper(cb.concat(cb.concat(root.get(UtenteEntity_.cognome), " "), root.get(UtenteEntity_.nome))), "%" + qUpper + "%"));

			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (nome.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.nome), nome.get())); 
		}
		

		if (idUtente.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.idUtente), idUtente.get())); 
		}
		
		if (stato.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.stato), stato.get())); 
		}
		
		
		if(idClassiUtente != null) {
			if(!idClassiUtente.isEmpty()) {
				predLst.add(root.join(UtenteEntity_.classi, JoinType.LEFT).in(idClassiUtente));
			} else {
				predLst.add(cb.disjunction());
			}
		}
		
		if (idOrganizzazione.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.organizzazione).get(OrganizzazioneEntity_.idOrganizzazione), idOrganizzazione.get().toString())); 
		}
		
		if (email.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + email.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(UtenteEntity_.email)), pattern));
			predLstQ.add(cb.like(cb.upper(root.get(UtenteEntity_.emailAziendale)), pattern));

			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}

		if (emailAziendale.isPresent()) {
			predLst.add(cb.equal(cb.lower(root.get(UtenteEntity_.emailAziendale)), emailAziendale.get().toLowerCase()));
		}

		if (principalLike.isPresent()) {
			String pattern = "%" + principalLike.get().toUpperCase() + "%";
			predLst.add(cb.like(cb.upper(root.get(UtenteEntity_.principal)), pattern)); 
		}
		
		if (principal.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.principal), principal.get())); 
		}
		
		if (referenteTecnico.isPresent()) {
			predLst.add(cb.equal(root.get(UtenteEntity_.referenteTecnico), referenteTecnico.get())); 
		}
		
		if(ruoli != null) {
			if(!ruoli.isEmpty()) {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(Ruolo ruolo: ruoli) {
					preds2.add(cb.equal(root.get(UtenteEntity_.ruolo), ruolo));
				}
				
				if(this.ruoloNull.isPresent()) {
					if(this.ruoloNull.get()) {
						preds2.add(cb.isNull(root.get(UtenteEntity_.ruolo)));
					} else {
						preds2.add(cb.isNotNull(root.get(UtenteEntity_.ruolo)));
					}
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			} else {
				if(this.ruoloNull.isPresent()) {
					if(this.ruoloNull.get()) {
						predLst.add(cb.isNull(root.get(UtenteEntity_.ruolo)));
					} else {
						predLst.add(cb.isNotNull(root.get(UtenteEntity_.ruolo)));
					}
				} else {
					predLst.add(cb.disjunction());
				}
			}
		} else {
			if(this.ruoloNull.isPresent()) {
				if(this.ruoloNull.get()) {
					predLst.add(cb.isNull(root.get(UtenteEntity_.ruolo)));
				} else {
					predLst.add(cb.isNotNull(root.get(UtenteEntity_.ruolo)));
				}
			}
		}
		
		return predLst;
	}

	public Optional<Stato> getStato() {
		return stato;
	}

	public void setStato(Optional<Stato> stato) {
		this.stato = stato;
	}

	public List<Ruolo> getRuoli() {
		return ruoli;
	}

	public void setRuoli(List<Ruolo> ruoli) {
		this.ruoli = ruoli;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<String> getIdUtente() {
		return idUtente;
	}

	public void setIdUtente(Optional<String> idUtente) {
		this.idUtente = idUtente;
	}

	public Optional<String> getNome() {
		return nome;
	}

	public void setNome(Optional<String> nome) {
		this.nome = nome;
	}

	public Optional<UUID> getIdOrganizzazione() {
		return idOrganizzazione;
	}

	public void setIdOrganizzazione(Optional<UUID> idOrganizzazione) {
		this.idOrganizzazione = idOrganizzazione;
	}

	public Optional<String> getEmail() {
		return email;
	}

	public void setEmail(Optional<String> email) {
		this.email = email;
	}

	public Optional<String> getEmailAziendale() {
		return emailAziendale;
	}

	public void setEmailAziendale(Optional<String> emailAziendale) {
		this.emailAziendale = emailAziendale;
	}

	public Optional<Boolean> getRuoloNull() {
		return ruoloNull;
	}

	public void setRuoloNull(Optional<Boolean> ruoloNull) {
		this.ruoloNull = ruoloNull;
	}

	public List<ClasseUtenteEntity> getIdClassiUtente() {
		return idClassiUtente;
	}

	public void setIdClassiUtente(List<ClasseUtenteEntity> idClassiUtente) {
		this.idClassiUtente = idClassiUtente;
	}

	public Optional<Boolean> getReferenteTecnico() {
		return referenteTecnico;
	}

	public void setReferenteTecnico(Optional<Boolean> referenteTecnico) {
		this.referenteTecnico = referenteTecnico;
	}

	public Optional<String> getPrincipal() {
		return principal;
	}

	public void setPrincipal(Optional<String> principal) {
		this.principal = principal;
	}

	public Optional<String> getPrincipalLike() {
		return principalLike;
	}

	public void setPrincipalLike(Optional<String> principalLike) {
		this.principalLike = principalLike;
	}

}
