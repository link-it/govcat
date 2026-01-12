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

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.JoinType;
import javax.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.AdesioneEntity_;
import org.govway.catalogo.core.orm.entity.CategoriaEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.DominioEntity.VISIBILITA;
import org.govway.catalogo.core.orm.entity.DominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteAdesioneEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteDominioEntity_;
import org.govway.catalogo.core.orm.entity.ReferenteServizioEntity_;
import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.ServizioEntity_;
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
	
}