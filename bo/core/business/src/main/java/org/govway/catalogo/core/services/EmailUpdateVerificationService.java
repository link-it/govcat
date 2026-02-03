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

import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.StatoVerifica;
import org.govway.catalogo.core.orm.entity.EmailUpdateVerificationEntity.TipoEmail;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Service per la gestione della verifica email in caso di modifica profilo.
 */
@Service
public class EmailUpdateVerificationService extends AbstractService {

    private static final Logger logger = LoggerFactory.getLogger(EmailUpdateVerificationService.class);

    /**
     * Trova o crea una richiesta di verifica email per l'utente.
     * Se esiste già una richiesta pendente, la aggiorna con la nuova email.
     *
     * @param utente l'utente che richiede la modifica
     * @param nuovaEmail la nuova email da verificare
     * @param tipoEmail il tipo di email da aggiornare (EMAIL o EMAIL_AZIENDALE)
     * @return la richiesta di verifica
     */
    public EmailUpdateVerificationEntity findOrCreateVerification(UtenteEntity utente, String nuovaEmail, TipoEmail tipoEmail) {
        logger.info("Ricerca o creazione verifica email per utente: {}, tipo: {}", utente.getIdUtente(), tipoEmail);

        // Cerca una richiesta esistente pendente o con codice inviato
        Optional<EmailUpdateVerificationEntity> existing =
            this.emailUpdateVerificationRepo.findFirstByUtenteOrderByDataCreazioneDesc(utente);

        if (existing.isPresent()) {
            EmailUpdateVerificationEntity verification = existing.get();
            StatoVerifica stato = verification.getStato();

            // Se è pendente o con codice inviato, aggiorna la richiesta esistente
            if (stato == StatoVerifica.PENDING || stato == StatoVerifica.CODE_SENT) {
                logger.info("Aggiornamento richiesta esistente ID: {}", verification.getId());
                verification.setNuovaEmail(nuovaEmail);
                verification.setTipoEmail(tipoEmail);
                verification.setStato(StatoVerifica.PENDING);
                verification.setCodiceVerifica(null);
                verification.setCodiceVerificaScadenza(null);
                verification.setTentativiVerifica(0);
                verification.setDataUltimoTentativo(new Date());
                this.emailUpdateVerificationRepo.save(verification);
                return verification;
            }
        }

        // Crea nuova richiesta
        logger.info("Creazione nuova richiesta di verifica email per utente: {}, tipo: {}", utente.getIdUtente(), tipoEmail);
        EmailUpdateVerificationEntity verification = new EmailUpdateVerificationEntity();
        verification.setUtente(utente);
        verification.setNuovaEmail(nuovaEmail);
        verification.setTipoEmail(tipoEmail);
        verification.setStato(StatoVerifica.PENDING);
        verification.setDataCreazione(new Date());
        verification.setDataUltimoTentativo(new Date());
        verification.setTentativiVerifica(0);
        verification.setTentativiInvio(0);

        this.emailUpdateVerificationRepo.save(verification);
        logger.info("Richiesta verifica creata con ID: {}", verification.getId());

        return verification;
    }

    /**
     * Trova la richiesta di verifica pendente per l'utente.
     *
     * @param utente l'utente
     * @return la richiesta se presente
     */
    public Optional<EmailUpdateVerificationEntity> findPendingVerification(UtenteEntity utente) {
        return this.emailUpdateVerificationRepo.findByUtenteAndStato(utente, StatoVerifica.CODE_SENT);
    }

    /**
     * Salva il codice di verifica.
     *
     * @param verification la richiesta di verifica
     * @param codice il codice generato
     * @param scadenza la data di scadenza
     */
    public void saveCodiceVerifica(EmailUpdateVerificationEntity verification, String codice, Date scadenza) {
        logger.info("Salvataggio codice verifica per richiesta ID: {}", verification.getId());
        verification.setCodiceVerifica(codice);
        verification.setCodiceVerificaScadenza(scadenza);
        verification.setStato(StatoVerifica.CODE_SENT);
        verification.setTentativiInvio(verification.getTentativiInvio() + 1);
        verification.setTentativiVerifica(0); // Reset tentativi verifica ad ogni nuovo invio
        verification.setDataUltimoTentativo(new Date());
        this.emailUpdateVerificationRepo.save(verification);
    }

    /**
     * Incrementa il contatore dei tentativi di verifica.
     *
     * @param verification la richiesta di verifica
     */
    public void incrementTentativiVerifica(EmailUpdateVerificationEntity verification) {
        verification.setTentativiVerifica(verification.getTentativiVerifica() + 1);
        verification.setDataUltimoTentativo(new Date());
        this.emailUpdateVerificationRepo.save(verification);
    }

    /**
     * Marca la verifica come completata con successo.
     *
     * @param verification la richiesta di verifica
     */
    public void markAsVerified(EmailUpdateVerificationEntity verification) {
        logger.info("Verifica completata per richiesta ID: {}", verification.getId());
        verification.setStato(StatoVerifica.VERIFIED);
        verification.setDataUltimoTentativo(new Date());
        this.emailUpdateVerificationRepo.save(verification);
    }

    /**
     * Marca la verifica come scaduta.
     *
     * @param verification la richiesta di verifica
     */
    public void markAsExpired(EmailUpdateVerificationEntity verification) {
        logger.info("Verifica scaduta per richiesta ID: {}", verification.getId());
        verification.setStato(StatoVerifica.EXPIRED);
        this.emailUpdateVerificationRepo.save(verification);
    }

    /**
     * Salva una richiesta di verifica.
     *
     * @param verification la richiesta da salvare
     */
    public void save(EmailUpdateVerificationEntity verification) {
        this.emailUpdateVerificationRepo.save(verification);
    }

    /**
     * Elimina tutte le richieste di verifica per un utente.
     *
     * @param utente l'utente
     */
    public void deleteByUtente(UtenteEntity utente) {
        this.emailUpdateVerificationRepo.deleteByUtente(utente);
    }

}
