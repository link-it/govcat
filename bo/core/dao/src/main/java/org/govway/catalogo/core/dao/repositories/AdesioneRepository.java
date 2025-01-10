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
package org.govway.catalogo.core.dao.repositories;

import java.util.List;

import org.govway.catalogo.core.orm.entity.AdesioneEntity;
import org.govway.catalogo.core.orm.entity.TIPO_REFERENTE;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

public interface AdesioneRepository extends JpaRepositoryImplementation<AdesioneEntity, Long> {

    @Query(value = "SELECT a.idAdesione FROM AdesioneEntity a join a.referenti r join r.referente u WHERE u.id = ?1 AND r.tipo = ?2 ")
    public List<String> getAdesioniByReferente(Long id, TIPO_REFERENTE tipo);

    @Query(value = "SELECT a.idAdesione FROM AdesioneEntity a join a.richiedente u WHERE u.id = ?1")
    public List<String> getAdesioniByRichiedente(Long id);

    @Query(value = "SELECT a.idAdesione FROM AdesioneEntity a join a.servizio s join s.referenti r join r.referente u WHERE u.id = ?1 AND r.tipo = ?2 ")
    public List<String> getAdesioniByReferenteServizio(Long id, TIPO_REFERENTE tipo);

    @Query(value = "SELECT a.idAdesione FROM AdesioneEntity a join a.servizio s join s.dominio d join d.referenti r join r.referente u WHERE u.id = ?1 AND r.tipo = ?2 ")
    public List<String> getAdesioniByReferenteDominio(Long id, TIPO_REFERENTE tipo);

    @Query(value = "SELECT a FROM AdesioneEntity a WHERE a.stato = ?1 OR a.stato=?2")
    Page<AdesioneEntity> getAdesioniByStati(String stato1,String stato2, Pageable pageable);

 //   @Query(value = "SELECT a.idAdesione FROM AdesioneEntity a WHERE a.stato IN (?1, ?2)")
 //   public List<AdesioneEntity> getAdesioniByStati(String stato1, String stato2);


}
