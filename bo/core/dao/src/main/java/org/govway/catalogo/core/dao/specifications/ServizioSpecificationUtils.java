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

import java.util.List;
import java.util.UUID;

import jakarta.persistence.criteria.AbstractQuery;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.From;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.SoggettoEntity_;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.jpa.domain.Specification;

public class ServizioSpecificationUtils {
	
	public static Specification<ServizioEntity> byIdServizio(UUID serviceId) {
		
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) ->
			cb.equal(root.get(ServizioEntity_.idServizio), serviceId.toString());
	}
	
	public static Specification<ServizioEntity> byReferenteServizio(UtenteEntity referent) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(ServizioEntity_.referenti, JoinType.LEFT).join(ReferenteServizioEntity_.referente, JoinType.LEFT));
		};
	}

	public static Specification<ServizioEntity> byReferenteServizioWithTipo(UtenteEntity referent, TIPO_REFERENTE tipo) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			var join = root.join(ServizioEntity_.referenti, JoinType.LEFT);
			return cb.and(
				cb.equal(join.get(ReferenteServizioEntity_.referente), referent),
				cb.equal(join.get(ReferenteServizioEntity_.tipo), tipo)
			);
		};
	}
	
	public static Specification<ServizioEntity> byVisibilita(VISIBILITA visibilita) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.equal(root.get(ServizioEntity_.visibilita), visibilita);
		};	
	}
	
	public static Specification<ServizioEntity> byVisibilitaGroup(DominioEntity.VISIBILITA visibilita) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.equal(root.get(ServizioEntity_.dominio).get(DominioEntity_.visibilita), visibilita);
		};	
	}
	
	public static Specification<ServizioEntity> byCategory(CategoriaEntity category) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(category).in(root.join(ServizioEntity_.categorie, JoinType.LEFT));
		};	
	}
	
	public static Specification<ServizioEntity> byReferenteServizioInAttesa(UtenteEntity referent, List<String> stati) {
		ServizioSpecification stateFilter = new ServizioSpecification();
		stateFilter.setStati(stati);
		
		return stateFilter.and(byReferenteServizio(referent));	
	}
	
	public static Specification<ServizioEntity> byStati(List<String> stati) {
		ServizioSpecification stateFilter = new ServizioSpecification();
		stateFilter.setStati(stati);
		
		return stateFilter;	
	}
	
	public static Specification<ServizioEntity> byRichiedente(UtenteEntity referent) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(ServizioEntity_.richiedente, JoinType.LEFT));
		};	
	}
	
	public static Specification<ServizioEntity> byRefAdesione(UtenteEntity referent) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(ServizioEntity_.adesioni, JoinType.LEFT).join(AdesioneEntity_.referenti, JoinType.LEFT).join(ReferenteAdesioneEntity_.referente, JoinType.LEFT));
		};	
	}
	
	public static Specification<ServizioEntity> byRichiedenteAdesione(UtenteEntity referent) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(ServizioEntity_.adesioni, JoinType.LEFT).get(AdesioneEntity_.richiedente));
		};	
	}
	
	public static Specification<ServizioEntity> byReferenteDominio(UtenteEntity referent) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).join(ReferenteDominioEntity_.referente, JoinType.LEFT));
		};
	}

	public static Specification<ServizioEntity> byReferenteDominioWithTipo(UtenteEntity referent, TIPO_REFERENTE tipo) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			var join = root.join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT);
			return cb.and(
				cb.equal(join.get(ReferenteDominioEntity_.referente), referent),
				cb.equal(join.get(ReferenteDominioEntity_.tipo), tipo)
			);
		};
	}
	

	/**
	 * Servizi la cui organizzazione titolare (organizzazione del soggetto referente del dominio)
	 * e` quella indicata: e` l'organizzazione erogatrice secondo il workflow.
	 */
	public static Specification<ServizioEntity> byOrganizzazioneTitolare(Long idOrganizzazione) {
		return (Root<ServizioEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) ->
			organizzazioneTitolare(root, cb, idOrganizzazione);
	}

	/**
	 * Predicato: l'organizzazione del soggetto referente del dominio del servizio e` quella indicata.
	 * I join sono LEFT, cosi` il predicato si puo` comporre in OR senza escludere i servizi privi
	 * della relazione.
	 */
	public static Predicate organizzazioneTitolare(From<?, ServizioEntity> servizio, CriteriaBuilder cb, Long idOrganizzazione) {
		return cb.equal(
				servizio.join(ServizioEntity_.dominio, JoinType.LEFT)
					.join(DominioEntity_.soggettoReferente, JoinType.LEFT)
					.join(SoggettoEntity_.organizzazione, JoinType.LEFT)
					.get(OrganizzazioneEntity_.id),
				idOrganizzazione);
	}

	/**
	 * Predicato: l'organizzazione indicata ha almeno un'adesione al servizio. Usa una subquery EXISTS,
	 * che non altera la cardinalita` del result set.
	 */
	public static Predicate organizzazioneAderente(From<?, ServizioEntity> servizio, AbstractQuery<?> query, CriteriaBuilder cb, Long idOrganizzazione) {
		Subquery<Integer> subAdesioni = query.subquery(Integer.class);
		Root<AdesioneEntity> adesione = subAdesioni.from(AdesioneEntity.class);
		subAdesioni.select(cb.literal(1)).where(
				cb.equal(adesione.get(AdesioneEntity_.servizio), servizio),
				cb.equal(
						adesione.join(AdesioneEntity_.soggetto, JoinType.LEFT)
							.join(SoggettoEntity_.organizzazione, JoinType.LEFT)
							.get(OrganizzazioneEntity_.id),
						idOrganizzazione));
		return cb.exists(subAdesioni);
	}

	/**
	 * Visibilita` dell'amministratore di un'organizzazione: i servizi di cui l'organizzazione e`
	 * titolare (in ogni stato) e quelli a cui ha aderito (anche riservati o privati).
	 */
	public static Predicate visibilitaAmministratoreOrganizzazione(From<?, ServizioEntity> servizio, AbstractQuery<?> query, CriteriaBuilder cb, Long idOrganizzazione) {
		return cb.or(
				organizzazioneTitolare(servizio, cb, idOrganizzazione),
				organizzazioneAderente(servizio, query, cb, idOrganizzazione));
	}

}