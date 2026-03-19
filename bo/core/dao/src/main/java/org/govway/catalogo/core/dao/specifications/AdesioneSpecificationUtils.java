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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.jpa.domain.Specification;

public class AdesioneSpecificationUtils {

	public static Specification<AdesioneEntity> byReferenteAdesione(UtenteEntity referent) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(AdesioneEntity_.referenti, JoinType.LEFT).join(ReferenteAdesioneEntity_.referente, JoinType.LEFT));
		};
	}

	public static Specification<AdesioneEntity> byReferenteAdesioneWithTipo(UtenteEntity referent, TIPO_REFERENTE tipo) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			var join = root.join(AdesioneEntity_.referenti, JoinType.LEFT);
			return cb.and(
				cb.equal(join.get(ReferenteAdesioneEntity_.referente), referent),
				cb.equal(join.get(ReferenteAdesioneEntity_.tipo), tipo)
			);
		};
	}

	public static Specification<AdesioneEntity> byReferenteServizio(UtenteEntity referent) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.referenti, JoinType.LEFT).join(ReferenteServizioEntity_.referente, JoinType.LEFT));
		};
	}

	public static Specification<AdesioneEntity> byReferenteServizioWithTipo(UtenteEntity referent, TIPO_REFERENTE tipo) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			var join = root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.referenti, JoinType.LEFT);
			return cb.and(
				cb.equal(join.get(ReferenteServizioEntity_.referente), referent),
				cb.equal(join.get(ReferenteServizioEntity_.tipo), tipo)
			);
		};
	}

	public static Specification<AdesioneEntity> byReferenteDominio(UtenteEntity referent) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT).join(ReferenteDominioEntity_.referente, JoinType.LEFT));
		};
	}

	public static Specification<AdesioneEntity> byReferenteDominioWithTipo(UtenteEntity referent, TIPO_REFERENTE tipo) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			var join = root.join(AdesioneEntity_.servizio, JoinType.LEFT).join(ServizioEntity_.dominio, JoinType.LEFT).join(DominioEntity_.referenti, JoinType.LEFT);
			return cb.and(
				cb.equal(join.get(ReferenteDominioEntity_.referente), referent),
				cb.equal(join.get(ReferenteDominioEntity_.tipo), tipo)
			);
		};
	}

	public static Specification<AdesioneEntity> byRichiedente(UtenteEntity referent) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.literal(referent).in(root.join(AdesioneEntity_.richiedente, JoinType.LEFT));
		};
	}

	public static Specification<AdesioneEntity> byRichiedenteServizio(UtenteEntity referent) {
		return (Root<AdesioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
			return cb.equal(root.join(AdesioneEntity_.servizio, JoinType.LEFT).get(ServizioEntity_.richiedente), referent);
		};
	}

	public static Specification<AdesioneEntity> byStati(List<String> stati) {
		AdesioneSpecification stateFilter = new AdesioneSpecification();
		stateFilter.setStati(stati);
		return stateFilter;
	}

}
