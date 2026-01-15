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

import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity.StatoRegistrazione;
import org.springframework.data.jpa.repository.support.JpaRepositoryImplementation;

/**
 * Repository per la gestione delle registrazioni utente al primo login.
 */
public interface RegistrazioneUtenteRepository extends JpaRepositoryImplementation<RegistrazioneUtenteEntity, Long> {

    /**
     * Trova una registrazione per principal (codice fiscale).
     * @param principal il principal/codice fiscale
     * @return la registrazione se presente
     */
    Optional<RegistrazioneUtenteEntity> findByPrincipal(String principal);

    /**
     * Trova una registrazione per principal e stato.
     * @param principal il principal/codice fiscale
     * @param stato lo stato della registrazione
     * @return la registrazione se presente
     */
    Optional<RegistrazioneUtenteEntity> findByPrincipalAndStato(String principal, StatoRegistrazione stato);

    /**
     * Trova una registrazione per token ID (associato alla sessione JWT).
     * @param tokenId l'ID del token JWT
     * @return la registrazione se presente
     */
    Optional<RegistrazioneUtenteEntity> findByTokenId(String tokenId);

    /**
     * Verifica se esiste una registrazione per il principal.
     * @param principal il principal/codice fiscale
     * @return true se esiste
     */
    boolean existsByPrincipal(String principal);

    /**
     * Conta le registrazioni completate per un principal.
     * @param principal il principal/codice fiscale
     * @return il numero di registrazioni completate
     */
    long countByPrincipalAndStato(String principal, StatoRegistrazione stato);

}
