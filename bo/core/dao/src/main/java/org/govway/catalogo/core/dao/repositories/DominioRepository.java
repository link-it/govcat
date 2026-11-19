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
package org.govway.catalogo.core.dao.repositories;

import org.govway.catalogo.core.orm.entity.DominioEntity;
import org.govway.catalogo.core.orm.entity.OrganizzazioneEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface DominioRepository extends JpaRepositoryImplementation<DominioEntity, Long> {

    // Domini dell'organizzazione (soggetto referente) di cui l'utente e` referente
    @Query(value = "SELECT d FROM DominioEntity d WHERE d.soggettoReferente.organizzazione = ?2"
            + " AND EXISTS (SELECT r FROM ReferenteDominioEntity r WHERE r.dominio = d AND r.referente = ?1)")
    public Page<DominioEntity> findConReferenteInOrganizzazione(UtenteEntity referente, OrganizzazioneEntity organizzazione, Pageable pageable);

}
