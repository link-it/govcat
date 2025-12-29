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
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.NotificaEntity;
import org.govway.catalogo.core.orm.entity.NotificaEntity.STATO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO;
import org.govway.catalogo.core.orm.entity.NotificaEntity.TIPO_ENTITA;
import org.govway.catalogo.core.orm.entity.NotificaEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.jpa.domain.Specification;

public class NotificaSpecification implements Specification<NotificaEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> idNotifica = Optional.empty();
	private Optional<ServizioEntity> servizio = Optional.empty();
	private Optional<AdesioneEntity> adesione = Optional.empty();
	private Optional<UUID> idEntita = Optional.empty();
	private Optional<TIPO> tipo = Optional.empty();
	private Optional<TIPO_ENTITA> tipoEntita = Optional.empty();
	private List<STATO> stati = null;
	private Optional<UtenteEntity> destinatario = Optional.empty();
	private Optional<UtenteEntity> mittente = Optional.empty();
	private boolean escludiEmail = false;
	private boolean soloEmailNonInviate = false;

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getIdNotifica() {
		return idNotifica;
	}

	public void setIdNotifica(Optional<UUID> idNotifica) {
		this.idNotifica = idNotifica;
	}

	public Optional<TIPO> getTipo() {
		return tipo;
	}

	public void setTipo(Optional<TIPO> tipo) {
		this.tipo = tipo;
	}

	public Optional<TIPO_ENTITA> getTipoEntita() {
		return tipoEntita;
	}

	public void setTipoEntita(Optional<TIPO_ENTITA> tipoEntita) {
		this.tipoEntita = tipoEntita;
	}

	public Optional<UtenteEntity> getDestinatario() {
		return destinatario;
	}

	public void setDestinatario(Optional<UtenteEntity> destinatario) {
		this.destinatario = destinatario;
	}

	@Override
	public Predicate toPredicate(Root<NotificaEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<NotificaEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.join(NotificaEntity_.servizio, JoinType.LEFT).get(ServizioEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.join(NotificaEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.soggettoReferente, JoinType.LEFT).get(SoggettoEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.join(NotificaEntity_.adesione, JoinType.LEFT).join(AdesioneEntity_.servizio, JoinType.LEFT).get(ServizioEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.join(NotificaEntity_.adesione, JoinType.LEFT).join(AdesioneEntity_.soggetto, JoinType.LEFT).get(SoggettoEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.join(NotificaEntity_.adesione, JoinType.LEFT).join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.soggettoReferente, JoinType.LEFT).get(SoggettoEntity_.nome)), pattern)); 
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (this.idNotifica.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.idNotifica), this.idNotifica.get().toString())); 
		}

		if (this.servizio.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.servizio), this.servizio.get())); 
		}

		if (this.adesione.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.adesione), this.adesione.get())); 
		}

		if (this.idEntita.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.idEntita), this.idEntita.get().toString())); 
		}

		if (this.tipo.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.tipo), this.tipo.get())); 
		}

		if (this.tipoEntita.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.tipoEntita), this.tipoEntita.get())); 
		}

		if(this.stati != null) {
			if (this.stati.isEmpty()) {
				predLst.add(cb.disjunction());
			} else {
				ArrayList<Predicate> preds2 = new ArrayList<>();
				
				for(STATO stato: stati) {
					preds2.add(cb.equal(root.get(NotificaEntity_.stato), stato));
				}
				
				predLst.add(cb.or(preds2.toArray(new Predicate[]{})));
			}
		}

		if(this.destinatario.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.destinatario), this.destinatario.get())); 
		}

		if(this.mittente.isPresent()) {
			predLst.add(cb.equal(root.get(NotificaEntity_.mittente), this.mittente.get()));
		}

		// Esclude le notifiche di tipo email (per la webapp che visualizza solo notifiche push)
		if(this.escludiEmail) {
			predLst.add(cb.notEqual(root.get(NotificaEntity_.tipo), TIPO.COMUNICAZIONE_EMAIL));
			predLst.add(cb.notEqual(root.get(NotificaEntity_.tipo), TIPO.CAMBIO_STATO_EMAIL));
		}

		// Filtra solo email non ancora inviate (per il servizio di invio email)
		if(this.soloEmailNonInviate) {
			// Include solo tipi email
			List<Predicate> tipiEmail = new ArrayList<>();
			tipiEmail.add(cb.equal(root.get(NotificaEntity_.tipo), TIPO.COMUNICAZIONE_EMAIL));
			tipiEmail.add(cb.equal(root.get(NotificaEntity_.tipo), TIPO.CAMBIO_STATO_EMAIL));
			predLst.add(cb.or(tipiEmail.toArray(new Predicate[]{})));

			// Email non ancora inviate (null o false)
			predLst.add(cb.or(
				cb.isNull(root.get(NotificaEntity_.emailInviata)),
				cb.equal(root.get(NotificaEntity_.emailInviata), false)
			));
		}

		return predLst;
	}

	public Optional<UUID> getIdEntita() {
		return idEntita;
	}

	public void setIdEntita(Optional<UUID> idEntita) {
		this.idEntita = idEntita;
	}

	public Optional<UtenteEntity> getMittente() {
		return mittente;
	}

	public void setMittente(Optional<UtenteEntity> mittente) {
		this.mittente = mittente;
	}

	public Optional<AdesioneEntity> getAdesione() {
		return adesione;
	}

	public void setAdesione(Optional<AdesioneEntity> adesione) {
		this.adesione = adesione;
	}

	public Optional<ServizioEntity> getServizio() {
		return servizio;
	}

	public void setServizio(Optional<ServizioEntity> servizio) {
		this.servizio = servizio;
	}

	public List<STATO> getStati() {
		return stati;
	}

	public void setStati(List<STATO> stati) {
		this.stati = stati;
	}

	public boolean isEscludiEmail() {
		return escludiEmail;
	}

	public void setEscludiEmail(boolean escludiEmail) {
		this.escludiEmail = escludiEmail;
	}

	public boolean isSoloEmailNonInviate() {
		return soloEmailNonInviate;
	}

	public void setSoloEmailNonInviate(boolean soloEmailNonInviate) {
		this.soloEmailNonInviate = soloEmailNonInviate;
	}

}
