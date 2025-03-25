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

import org.govway.catalogo.core.orm.entity.*;
import org.springframework.data.jpa.domain.Specification;

import javax.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class SoggettoProfiloSpecification implements Specification<SoggettoProfiloEntity> {

    private Optional<String> q = Optional.empty();
    private Optional<UUID> idProfilo = Optional.empty();
    private Optional<String> idSoggetto = Optional.empty();

    @Override
    public Predicate toPredicate(Root<SoggettoProfiloEntity> root, CriteriaQuery<?> query, CriteriaBuilder criteriaBuilder) {
        List<Predicate> predicateList = this._toPredicateList(root, query, criteriaBuilder);

        if(predicateList.isEmpty()) {
            return null;
        }
        return criteriaBuilder.and(predicateList.toArray(new Predicate[]{}));
    }

    protected List<Predicate> _toPredicateList(Root<SoggettoProfiloEntity> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        List<Predicate> predicateList = new ArrayList<>();

        if (q.isPresent()) {
            List<Predicate> predLstQ = new ArrayList<>();
            predLstQ.add(cb.like(cb.upper(root.join(SoggettoProfiloEntity_.profilo, JoinType.LEFT).get(ProfiloEntity_.codiceInterno)), "%" + q.get().toUpperCase() + "%"));
            predLstQ.add(cb.like(cb.upper(root.join(SoggettoProfiloEntity_.profilo, JoinType.LEFT).get(ProfiloEntity_.etichetta)), "%" + q.get().toUpperCase() + "%"));
            predLstQ.add(cb.like(cb.upper(root.join(SoggettoProfiloEntity_.soggetto, JoinType.LEFT).get(SoggettoEntity_.nome)), "%" + q.get().toUpperCase() + "%"));
            predLstQ.add(cb.like(cb.upper(root.join(SoggettoProfiloEntity_.soggetto, JoinType.LEFT).get(SoggettoEntity_.descrizione)), "%" + q.get().toUpperCase() + "%"));

            predicateList.add(cb.or(predLstQ.toArray(new Predicate[] {})));
        }

        if (idProfilo.isPresent()) {
            predicateList.add(cb.equal(root.join(SoggettoProfiloEntity_.profilo, JoinType.LEFT).get(ProfiloEntity_.idProfilo), idProfilo.get()));
        }

        if (idSoggetto.isPresent()) {
            predicateList.add(cb.equal(cb.upper(root.join(SoggettoProfiloEntity_.soggetto, JoinType.LEFT).get(SoggettoEntity_.idSoggetto)), idSoggetto.get().toUpperCase()));
        }


        return predicateList;
    }

    public Optional<String> getIdSoggetto() {
        return idSoggetto;
    }

    public void setIdSoggetto(Optional<String> idSoggetto) {
        this.idSoggetto = idSoggetto;
    }

    public Optional<UUID> getIdProfilo() {
        return idProfilo;
    }

    public void setIdProfilo(Optional<UUID> idProfilo) {
        this.idProfilo = idProfilo;
    }

    public Optional<String> getQ() {
        return q;
    }

    public void setQ(Optional<String> q) {
        this.q = q;
    }
}
