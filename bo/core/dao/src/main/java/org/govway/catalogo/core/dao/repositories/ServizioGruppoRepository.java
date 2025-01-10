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

import org.govway.catalogo.core.orm.entity.ServizioGruppoEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;
import org.springframework.data.repository.query.Param;

public interface ServizioGruppoRepository extends JpaRepositoryImplementation<ServizioGruppoEntity, Long> {

    @Query(nativeQuery = true,
            value = "select * from (SELECT id, 'GRUPPO' AS tipo, id_gruppo AS id_entita, nome, NULL AS versione, descrizione, descrizione_sintetica, id_immagine, id_gruppo_padre AS id_gruppo, NULL AS stato, NULL, 1 AS referente_servizio, 1 AS referente_dominio, :ref as id_richiedente, 1 AS classi_utente FROM gruppi" +
            		"UNION" +
            		"SELECT id, 'SERVIZIO' AS tipo, id_servizio AS id_entita, nome, versione, descrizione, descrizione_sintetica, id_immagine, id_gruppo, stato, visibilita," +
            		"(SELECT count(*) FROM referenti_servizi WHERE ID_SERVIZIO = servizi.id AND id_referente = :ref) AS referente_servizio," +
            		"(SELECT count(*) FROM referenti_domini WHERE ID_dominio = servizi.ID_DOMINIO AND id_referente = :ref) AS referente_dominio," +
            		"id_richiedente," +
            		"(SELECT count(*) FROM CLASSI_SERVIZI cs WHERE ID_SERVIZIO = servizi.ID AND ID_CLASSE IN (SELECT id_classe FROM CLASSI_REFERENTS cr WHERE cr.REFERENT_ID = :ref)) AS classi_utente" +
            		"FROM servizi)" +
            		"where visibilita = 'PUBBLICO' OR id_richiedente = :ref OR referente_servizio > 0 OR referente_dominio > 0 OR (classi_utente > 0 AND visibilita = 'PRIVATO')")
    public Page<ServizioGruppoEntity> findAllByUtente(@Param("ref") Long idUtente, Pageable page);
}
