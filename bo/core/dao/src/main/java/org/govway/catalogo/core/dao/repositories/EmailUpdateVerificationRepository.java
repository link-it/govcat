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

import java.util.Optional;

import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.StatoVerifica;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

/**
 * Repository per la gestione delle richieste di modifica email utente.
 */
public interface EmailUpdateVerificationRepository extends JpaRepositoryImplementation<EmailUpdateVerificationEntity, Long> {

    /**
     * Trova una verifica pendente per utente.
     * @param utente l'utente
     * @param stato lo stato della verifica
     * @return la verifica se presente
     */
    Optional<EmailUpdateVerificationEntity> findByUtenteAndStato(UtenteEntity utente, StatoVerifica stato);

    /**
     * Trova l'ultima verifica per utente (qualsiasi stato).
     * @param utente l'utente
     * @return la verifica se presente
     */
    Optional<EmailUpdateVerificationEntity> findFirstByUtenteOrderByDataCreazioneDesc(UtenteEntity utente);

    /**
     * Trova una verifica pendente (CODE_SENT) per utente.
     * @param utente l'utente
     * @return la verifica se presente
     */
    default Optional<EmailUpdateVerificationEntity> findPendingByUtente(UtenteEntity utente) {
        return findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
    }

    /**
     * Verifica se esiste una verifica pendente per l'utente.
     * @param utente l'utente
     * @param stato lo stato
     * @return true se esiste
     */
    boolean existsByUtenteAndStato(UtenteEntity utente, StatoVerifica stato);

    /**
     * Elimina tutte le verifiche per un utente.
     * @param utente l'utente
     */
    void deleteByUtente(UtenteEntity utente);

}
