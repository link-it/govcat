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

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity_;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity_;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteOrganizzazioneEntity_;
import org.springframework.data.jpa.domain.Specification;

public class UtenteOrganizzazioneSpecification implements Specification<UtenteOrganizzazioneEntity> {

	private static final long serialVersionUID = 1L;

	private Optional<OrganizzazioneEntity> organizzazione = Optional.empty();
	private Optional<String> q = Optional.empty();

	@Override
	public Predicate toPredicate(Root<UtenteOrganizzazioneEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
		List<Predicate> predicates = new ArrayList<>();

		if (organizzazione.isPresent()) {
			predicates.add(cb.equal(
					root.get(UtenteOrganizzazioneEntity_.organizzazione).get(OrganizzazioneEntity_.id),
					organizzazione.get().getId()));
		}

		if (q.isPresent() && !q.get().isBlank()) {
			String pattern = "%" + q.get().toUpperCase() + "%";
			Path<UtenteEntity> utente = root.get(UtenteOrganizzazioneEntity_.utente);

			List<Predicate> qPreds = new ArrayList<>();
			qPreds.add(cb.like(cb.upper(utente.get(UtenteEntity_.principal)), pattern));
			qPreds.add(cb.like(cb.upper(utente.get(UtenteEntity_.nome)), pattern));
			qPreds.add(cb.like(cb.upper(utente.get(UtenteEntity_.cognome)), pattern));
			// nome + " " + cognome (es. "Mario Rossi")
			qPreds.add(cb.like(
					cb.upper(cb.concat(cb.concat(utente.get(UtenteEntity_.nome), " "), utente.get(UtenteEntity_.cognome))),
					pattern));
			// cognome + " " + nome (es. "Rossi Mario")
			qPreds.add(cb.like(
					cb.upper(cb.concat(cb.concat(utente.get(UtenteEntity_.cognome), " "), utente.get(UtenteEntity_.nome))),
					pattern));

			predicates.add(cb.or(qPreds.toArray(new Predicate[0])));
		}

		if (predicates.isEmpty()) {
			return null;
		}
		return cb.and(predicates.toArray(new Predicate[0]));
	}

	public Optional<OrganizzazioneEntity> getOrganizzazione() {
		return organizzazione;
	}

	public void setOrganizzazione(Optional<OrganizzazioneEntity> organizzazione) {
		this.organizzazione = organizzazione;
	}

	public Optional<String> getQ() {
		return q;
	}

	public void setQ(Optional<String> q) {
		this.q = q;
	}
}
