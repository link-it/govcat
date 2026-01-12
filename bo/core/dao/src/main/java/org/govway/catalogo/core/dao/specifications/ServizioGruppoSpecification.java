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

import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ClasseUtenteEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.GruppoEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity_;
import org.govway.catalogo.core.orm.entity.TipoServizio;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.jpa.domain.Specification;

public class ServizioGruppoSpecification implements Specification<ServizioGruppoEntity> {


	private static final long serialVersionUID = 1L;

	private Optional<String> q = Optional.empty();
	private Optional<UUID> gruppo = Optional.empty();
	private Optional<Boolean> gruppoPadreNull = Optional.empty();
	private Optional<UtenteEntity> utente = Optional.empty();
	private Optional<VISIBILITA> visibilita = Optional.empty();
	private Optional<TipoServizio> tipoComponente = Optional.empty();
	private Optional<Boolean> utenteAdmin = Optional.empty();


	@Override
	public Predicate toPredicate(Root<ServizioGruppoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = this._toPredicateList(root, query, cb);
		
		if(predLst.isEmpty()) {
			return null;
		}
		return cb.and(predLst.toArray(new Predicate[]{}));
	}
	
	protected List<Predicate> _toPredicateList(Root<ServizioGruppoEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predLst = new ArrayList<>();
		
		query.distinct(true); 

		if (q.isPresent()) {
			List<Predicate> predLstQ = new ArrayList<>();
			String pattern = "%" + q.get().toUpperCase() + "%";
			predLstQ.add(cb.like(cb.upper(root.get(ServizioGruppoEntity_.nome)), pattern)); 
			predLstQ.add(cb.like(cb.upper(root.get(ServizioGruppoEntity_.descrizione)), pattern));
			predLstQ.add(cb.like(cb.upper(root.get(ServizioGruppoEntity_.descrizioneSintetica)), pattern));
			
			predLst.add(cb.or(predLstQ.toArray(new Predicate[] {})));
		}
		
		if (tipoComponente.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioGruppoEntity_.tipoComponente), tipoComponente.get()));
		}
		
		if(gruppo.isPresent()) {
			predLst.add(cb.equal(root.get(ServizioGruppoEntity_.gruppo).get(GruppoEntity_.idGruppo), gruppo.get().toString()));
		}

		if (gruppoPadreNull.isPresent()) {
			if(gruppoPadreNull.get()) {
				predLst.add(cb.isNull(root.get(ServizioGruppoEntity_.gruppo))); 
			} else {
				predLst.add(cb.isNotNull(root.get(ServizioGruppoEntity_.gruppo)));
			}
		}

		if(utente.isPresent()) {

			UtenteEntity utente = this.utente.get();

			// Per vedere un servizio deve essere o pubblico e negli stati "aderibili", o nei miei servizi, e non deve essere archiviato 
			
			// Condizione 1: i miei servizi (tutti i servizi di cui sono referente in qualche modo)
			
			List<Predicate> predListMieiServizi = new ArrayList<>();
			if(utente.getId() != null) {
				predListMieiServizi.add(cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.referenti, JoinType.LEFT).get(ReferenteServizioEntity_.referente).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).get(ReferenteDominioEntity_.referente).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.classi, JoinType.LEFT).join(ClasseUtenteEntity_.utentiAssociati, JoinType.LEFT).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).get(ServizioEntity_.richiedente).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id), utente.getId()));
				predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.adesioni, JoinType.LEFT).join(AdesioneEntity_.referenti, JoinType.LEFT).join(ReferenteAdesioneEntity_.referente, JoinType.LEFT).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id)));
				predListMieiServizi.add(cb.literal(utente.getId()).in(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.adesioni, JoinType.LEFT).get(AdesioneEntity_.richiedente).get(org.govway.catalogo.core.orm.entity.UtenteEntity_.id)));
			}

			ArrayList<Predicate> predsStati = new ArrayList<>();
			
			for(String stato: getStatiAderibili()) {
				predsStati.add(cb.equal(root.get(ServizioGruppoEntity_.stato), stato));
			}
			
			List<Predicate> predLstPubblico = new ArrayList<>();
			predLstPubblico.add(getVisibilitaFilter(VISIBILITA.PUBBLICO, root, cb)); 
			
			predLstPubblico.add(cb.or(predsStati.toArray(new Predicate[]{})));
			
			List<Predicate> predLstUtente = new ArrayList<>();
			
			if(!predListMieiServizi.isEmpty()) {
				predLstUtente.add(cb.or(predListMieiServizi.toArray(new Predicate[]{})));
			}
			predLstUtente.add(cb.and(predLstPubblico.toArray(new Predicate[]{})));

			predLst.add(cb.or(predLstUtente.toArray(new Predicate[] {})));
				
			Predicate visibilitaNonComponente = cb.not(cb.equal(root.get(ServizioGruppoEntity_.visibilita), VISIBILITA.COMPONENTE)); 
			Predicate visibilitaNull = cb.isNull(root.get(ServizioGruppoEntity_.visibilita)); 
			
			predLst.add(cb.or(visibilitaNull, visibilitaNonComponente));

		}

		if(this.utenteAdmin.isPresent() && !this.utenteAdmin.get()) {
			predLst.add(cb.notEqual(root.get(ServizioGruppoEntity_.stato), "archiviato"));
		}
		

		if (visibilita.isPresent()) {
			predLst.add(getVisibilitaFilter(visibilita.get(), root, cb));
		}
		
		return predLst;
	}
	
	private Predicate getVisibilitaFilter(VISIBILITA visibilita, Root<ServizioGruppoEntity> root, CriteriaBuilder cb) {
		Predicate statoServizio = cb.equal(root.get(ServizioGruppoEntity_.visibilita), visibilita); 
		Predicate statoNull = cb.isNull(root.get(ServizioGruppoEntity_.visibilita)); 
		Predicate statoDominio = cb.equal(root.join(ServizioGruppoEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).get(DominioEntity_.visibilita), visibilita);
		return cb.or(statoServizio, cb.and(statoNull, statoDominio));
	}
	
	
	private List<String> getStatiAderibili() {
		List<String> lst = new ArrayList<>();
		
		lst.add("pubblicato_collaudo");
		lst.add("richiesto_produzione");
		lst.add("autorizzato_produzione");
		lst.add("in_configurazione_produzione");
		lst.add("pubblicato_produzione");
		
		return lst;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}

	public Optional<UUID> getGruppo() {
		return gruppo;
	}

	public void setGruppo(Optional<UUID> gruppo) {
		this.gruppo = gruppo;
	}

	public Optional<Boolean> getGruppoPadreNull() {
		return gruppoPadreNull;
	}

	public void setGruppoPadreNull(Optional<Boolean> gruppoPadreNull) {
		this.gruppoPadreNull = gruppoPadreNull;
	}

	public Optional<UtenteEntity> getUtente() {
		return utente;
	}

	public void setUtente(Optional<UtenteEntity> utente) {
		this.utente = utente;
	}

	public Optional<VISIBILITA> getVisibilita() {
		return visibilita;
	}

	public void setVisibilita(Optional<VISIBILITA> visibilita) {
		this.visibilita = visibilita;
	}

	public Optional<TipoServizio> getTipoComponente() {
		return tipoComponente;
	}

	public void setTipoComponente(Optional<TipoServizio> tipoComponente) {
		this.tipoComponente = tipoComponente;
	}

	public Optional<Boolean> getUtenteAdmin() {
		return utenteAdmin;
	}

	public void setUtenteAdmin(Optional<Boolean> utenteAdmin) {
		this.utenteAdmin = utenteAdmin;
	}
}
