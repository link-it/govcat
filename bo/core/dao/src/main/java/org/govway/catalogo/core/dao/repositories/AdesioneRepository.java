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

import java.util.Collection;
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

    @Query(value = "SELECT a FROM AdesioneEntity a WHERE a.richiedente.id = ?1")
    public List<AdesioneEntity> findByRichiedente(Long id);

    @Query(value = "SELECT a FROM AdesioneEntity a WHERE a.adesioneCollaudo = ?1")
    public List<AdesioneEntity> findByAdesioneCollaudo(AdesioneEntity adesioneCollaudo);

    // Esistenza di adesioni per il servizio senza materializzare la collezione (SELECT ... LIMIT-like):
    // usata da ServizioService.isEliminabile per le viste di lista (servizi/adesioni), dove .isEmpty()
    // sulla collezione lazy caricava tutte le adesioni del servizio (collo di bottiglia per i servizi popolari).
    @Query(value = "SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END FROM AdesioneEntity a WHERE a.servizio.id = ?1")
    public boolean existsByServizioId(Long idServizio);

    // Adesioni non archiviate del servizio, con soggetto e organizzazione aderente (riepilogo delle
    // quote di rate limiting assegnate ai fruitori). Il pattern (gia` in maiuscolo, "%" per nessun
    // filtro) si confronta con nome del soggetto, nome dell'organizzazione e id logico.
    String SELECT_FRUITORI = "SELECT a FROM AdesioneEntity a JOIN FETCH a.soggetto s LEFT JOIN FETCH s.organizzazione o ";
    String COUNT_FRUITORI = "SELECT COUNT(a) FROM AdesioneEntity a JOIN a.soggetto s LEFT JOIN s.organizzazione o ";
    String WHERE_FRUITORI = "WHERE a.servizio.id = ?1 AND a.stato <> ?2 "
            + "AND (UPPER(s.nome) LIKE ?3 OR UPPER(o.nome) LIKE ?3 OR UPPER(a.idLogico) LIKE ?3) ";

    @Query(value = SELECT_FRUITORI + WHERE_FRUITORI, countQuery = COUNT_FRUITORI + WHERE_FRUITORI)
    Page<AdesioneEntity> findByServizioNonArchiviate(Long idServizio, String statoArchiviato, String pattern, Pageable pageable);

    @Query(value = SELECT_FRUITORI + WHERE_FRUITORI + "AND a.stato IN ?4",
            countQuery = COUNT_FRUITORI + WHERE_FRUITORI + "AND a.stato IN ?4")
    Page<AdesioneEntity> findByServizioNonArchiviateInStati(Long idServizio, String statoArchiviato, String pattern, Collection<String> stati, Pageable pageable);

    @Query(value = SELECT_FRUITORI + WHERE_FRUITORI + "AND a.stato NOT IN ?4",
            countQuery = COUNT_FRUITORI + WHERE_FRUITORI + "AND a.stato NOT IN ?4")
    Page<AdesioneEntity> findByServizioNonArchiviateNotInStati(Long idServizio, String statoArchiviato, String pattern, Collection<String> stati, Pageable pageable);

}
