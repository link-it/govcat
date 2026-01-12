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

import java.util.List;

import org.govway.catalogo.core.orm.entity.ServizioEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface ServizioRepository extends JpaRepositoryImplementation<ServizioEntity, Long> {

    @Query(value = "SELECT s.idServizio FROM ServizioEntity s join s.referenti r join r.referente u WHERE u.id = ?1 AND r.tipo = ?2 ")
    public List<String> getServiziByReferente(Long id, TIPO_REFERENTE tipo);

    @Query(value = "SELECT s.idServizio FROM ServizioEntity s join s.richiedente u WHERE u.id = ?1")
    public List<String> getServiziByRichiedente(Long id);

    @Query(value = "SELECT s.idServizio FROM ServizioEntity s join s.dominio d join d.referenti r join r.referente u WHERE u.id = ?1 AND r.tipo = ?2 ")
    public List<String> getServiziByReferenteDominio(Long id, TIPO_REFERENTE tipo);

    
}
