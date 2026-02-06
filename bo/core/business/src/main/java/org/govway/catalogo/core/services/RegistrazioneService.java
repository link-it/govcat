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
package org.govway.catalogo.core.services;

import java.util.Date;
import java.util.Optional;

import org.govway.catalogo.core.dao.specifications.UtenteSpecification;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity.StatoRegistrazione;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service per la gestione della registrazione utente al primo login.
 */
@Service
public class RegistrazioneService extends AbstractService {

    private static final Logger logger = LoggerFactory.getLogger(RegistrazioneService.class);

    /**
     * Trova una registrazione esistente per principal.
     *
     * @param principal il principal (codice fiscale)
     * @return la registrazione se presente
     */
    public Optional<RegistrazioneUtenteEntity> findByPrincipal(String principal) {
        return this.registrazioneUtenteRepo.findByPrincipal(principal);
    }

    /**
     * Trova una registrazione per principal e stato.
     *
     * @param principal il principal
     * @param stato lo stato
     * @return la registrazione se presente
     */
    public Optional<RegistrazioneUtenteEntity> findByPrincipalAndStato(String principal, StatoRegistrazione stato) {
        return this.registrazioneUtenteRepo.findByPrincipalAndStato(principal, stato);
    }

    /**
     * Trova una registrazione per token ID.
     *
     * @param tokenId l'ID del token JWT
     * @return la registrazione se presente
     */
    public Optional<RegistrazioneUtenteEntity> findByTokenId(String tokenId) {
        return this.registrazioneUtenteRepo.findByTokenId(tokenId);
    }

    /**
     * Crea una nuova registrazione per l'utente.
     *
     * @param principal principal (codice fiscale) dal JWT
     * @param nome nome dal JWT
     * @param cognome cognome dal JWT
     * @param emailJwt email dal JWT
     * @param tokenId ID del token JWT
     * @return la nuova registrazione creata
     */
    public RegistrazioneUtenteEntity createRegistrazione(String principal, String nome, String cognome,
                                                          String emailJwt, String tokenId) {
        logger.info("Creazione nuova registrazione per principal: {}", principal);

        // Verifica se esiste già una registrazione non completata per questo principal
        Optional<RegistrazioneUtenteEntity> existingReg = findByPrincipal(principal);
        if (existingReg.isPresent()) {
            RegistrazioneUtenteEntity reg = existingReg.get();
            // Se è già completata, non permettere nuova registrazione
            if (reg.getStato() == StatoRegistrazione.COMPLETED) {
                throw new IllegalStateException("Utente già registrato con questo principal");
            }
            // Altrimenti riusa la registrazione esistente incrementando i tentativi
            reg.setTentativiTotali(reg.getTentativiTotali() + 1);
            reg.setStato(StatoRegistrazione.PENDING);
            reg.setTokenId(tokenId);
            reg.setDataUltimoTentativo(new Date());
            reg.setCodiceVerifica(null);
            reg.setCodiceVerificaScadenza(null);
            reg.setTentativiVerifica(0);
            this.registrazioneUtenteRepo.save(reg);
            return reg;
        }

        // Crea nuova registrazione
        RegistrazioneUtenteEntity registrazione = new RegistrazioneUtenteEntity();
        registrazione.setPrincipal(principal);
        registrazione.setNome(nome);
        registrazione.setCognome(cognome);
        registrazione.setEmailJwt(emailJwt);
        registrazione.setEmailProposta(emailJwt); // Default: email dal JWT
        registrazione.setStato(StatoRegistrazione.PENDING);
        registrazione.setDataCreazione(new Date());
        registrazione.setDataUltimoTentativo(new Date());
        registrazione.setTentativiTotali(1);
        registrazione.setTentativiVerifica(0);
        registrazione.setTokenId(tokenId);

        this.registrazioneUtenteRepo.save(registrazione);
        logger.info("Registrazione creata con ID: {}", registrazione.getId());

        return registrazione;
    }

    /**
     * Aggiorna l'email proposta per la registrazione.
     *
     * @param registrazione la registrazione da aggiornare
     * @param nuovaEmail la nuova email
     */
    public void updateEmailProposta(RegistrazioneUtenteEntity registrazione, String nuovaEmail) {
        logger.info("Aggiornamento email proposta per registrazione ID: {}", registrazione.getId());
        registrazione.setEmailProposta(nuovaEmail);
        registrazione.setStato(StatoRegistrazione.PENDING);
        // Reset codice verifica quando cambia l'email
        registrazione.setCodiceVerifica(null);
        registrazione.setCodiceVerificaScadenza(null);
        registrazione.setTentativiVerifica(0);
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Salva il codice di verifica per la registrazione.
     *
     * @param registrazione la registrazione
     * @param codice il codice generato
     * @param scadenza la data di scadenza
     */
    public void saveCodiceVerifica(RegistrazioneUtenteEntity registrazione, String codice, Date scadenza) {
        logger.info("Salvataggio codice verifica per registrazione ID: {}", registrazione.getId());
        registrazione.setCodiceVerifica(codice);
        registrazione.setCodiceVerificaScadenza(scadenza);
        registrazione.setStato(StatoRegistrazione.EMAIL_SENT);
        registrazione.setDataUltimoTentativo(new Date());
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Incrementa il contatore dei tentativi di verifica.
     *
     * @param registrazione la registrazione
     */
    public void incrementTentativiVerifica(RegistrazioneUtenteEntity registrazione) {
        registrazione.setTentativiVerifica(registrazione.getTentativiVerifica() + 1);
        registrazione.setDataUltimoTentativo(new Date());
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Marca la registrazione come verificata (email confermata).
     *
     * @param registrazione la registrazione
     */
    public void markAsVerified(RegistrazioneUtenteEntity registrazione) {
        logger.info("Email verificata per registrazione ID: {}", registrazione.getId());
        registrazione.setStato(StatoRegistrazione.VERIFIED);
        registrazione.setDataUltimoTentativo(new Date());
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Marca la registrazione come completata.
     *
     * @param registrazione la registrazione
     */
    public void markAsCompleted(RegistrazioneUtenteEntity registrazione) {
        logger.info("Registrazione completata per ID: {}", registrazione.getId());
        registrazione.setStato(StatoRegistrazione.COMPLETED);
        registrazione.setDataUltimoTentativo(new Date());
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Marca la registrazione come scaduta.
     *
     * @param registrazione la registrazione
     */
    public void markAsExpired(RegistrazioneUtenteEntity registrazione) {
        logger.info("Registrazione scaduta per ID: {}", registrazione.getId());
        registrazione.setStato(StatoRegistrazione.EXPIRED);
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Verifica se esiste un utente con l'email aziendale specificata.
     *
     * @param emailAziendale l'email aziendale da cercare
     * @return l'utente se trovato
     */
    public Optional<UtenteEntity> findUtenteByEmailAziendale(String emailAziendale) {
        UtenteSpecification spec = new UtenteSpecification();
        spec.setEmailAziendale(Optional.of(emailAziendale));
        return this.utenteRepo.findOne(spec);
    }

    /**
     * Aggiorna il principal di un utente esistente.
     *
     * @param utente l'utente da aggiornare
     * @param nuovoPrincipal il nuovo principal
     */
    public void updatePrincipal(UtenteEntity utente, String nuovoPrincipal) {
        logger.info("Aggiornamento principal per utente ID: {} con nuovo principal: {}",
                    utente.getIdUtente(), nuovoPrincipal);
        utente.setPrincipal(nuovoPrincipal);
        this.utenteRepo.save(utente);
    }

    /**
     * Salva un'entità registrazione.
     *
     * @param registrazione la registrazione da salvare
     */
    public void save(RegistrazioneUtenteEntity registrazione) {
        this.registrazioneUtenteRepo.save(registrazione);
    }

    /**
     * Conta il numero totale di tentativi di registrazione per un principal.
     *
     * @param principal il principal
     * @return numero di tentativi
     */
    public int countTentativiByPrincipal(String principal) {
        return findByPrincipal(principal)
                .map(RegistrazioneUtenteEntity::getTentativiTotali)
                .orElse(0);
    }
}
