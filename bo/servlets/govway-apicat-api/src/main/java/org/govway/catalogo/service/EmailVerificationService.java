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
package org.govway.catalogo.service;

import java.security.SecureRandom;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Servizio per la generazione e invio di codici di verifica email.
 * Attivo solo quando è configurato il mail sender.
 */
@Service
public class EmailVerificationService {

    private static final Logger logger = LoggerFactory.getLogger(EmailVerificationService.class);

    private static final String ALPHANUMERIC_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${firstlogin.verification.code.length:6}")
    private int codeLength;

    @Value("${firstlogin.verification.code.duration.minutes:5}")
    private int codeDurationMinutes;

    @Value("${firstlogin.verification.mail.from:noreply@govcat.it}")
    private String mailFrom;

    @Value("${firstlogin.verification.mail.subject:GovCat - Codice di verifica email}")
    private String mailSubject;

    /**
     * Genera un codice alfanumerico casuale.
     * Esclude caratteri ambigui (0, O, 1, I, L) per evitare confusione.
     *
     * @return codice alfanumerico di lunghezza configurata
     */
    public String generateVerificationCode() {
        StringBuilder code = new StringBuilder(codeLength);
        for (int i = 0; i < codeLength; i++) {
            int index = SECURE_RANDOM.nextInt(ALPHANUMERIC_CHARS.length());
            code.append(ALPHANUMERIC_CHARS.charAt(index));
        }
        return code.toString();
    }

    /**
     * Calcola la data di scadenza del codice.
     *
     * @return data di scadenza
     */
    public Date calculateExpirationTime() {
        return new Date(System.currentTimeMillis() + (codeDurationMinutes * 60L * 1000L));
    }

    /**
     * Restituisce la durata del codice in minuti.
     *
     * @return durata in minuti
     */
    public int getCodeDurationMinutes() {
        return codeDurationMinutes;
    }

    /**
     * Verifica se un codice è valido (match e non scaduto).
     *
     * @param inputCode codice inserito dall'utente
     * @param storedCode codice memorizzato
     * @param expirationTime tempo di scadenza
     * @return true se il codice è valido
     */
    public boolean isCodeValid(String inputCode, String storedCode, Date expirationTime) {
        if (inputCode == null || storedCode == null || expirationTime == null) {
            return false;
        }

        // Verifica scadenza
        if (new Date().after(expirationTime)) {
            logger.debug("Codice scaduto");
            return false;
        }

        // Confronto case-insensitive
        return inputCode.equalsIgnoreCase(storedCode);
    }

    /**
     * Verifica se un codice è scaduto.
     *
     * @param expirationTime tempo di scadenza
     * @return true se il codice è scaduto
     */
    public boolean isCodeExpired(Date expirationTime) {
        return expirationTime == null || new Date().after(expirationTime);
    }

    /**
     * Invia email con il codice di verifica.
     *
     * @param toEmail indirizzo email destinatario
     * @param code codice di verifica
     * @param nome nome dell'utente
     * @param cognome cognome dell'utente
     * @throws IllegalStateException se il mail sender non è configurato
     */
    public void sendVerificationEmail(String toEmail, String code, String nome, String cognome) {
        if (mailSender == null) {
            logger.error("JavaMailSender non configurato. Impossibile inviare email di verifica.");
            throw new IllegalStateException("Servizio email non configurato");
        }

        logger.info("Invio email di verifica a: {}", toEmail);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject(mailSubject);
        message.setText(buildEmailBody(code, nome, cognome));

        try {
            mailSender.send(message);
            logger.info("Email di verifica inviata con successo a: {}", toEmail);
        } catch (Exception e) {
            logger.error("Errore durante l'invio dell'email di verifica a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Errore durante l'invio dell'email di verifica", e);
        }
    }

    /**
     * Costruisce il corpo dell'email di verifica.
     *
     * @param code codice di verifica
     * @param nome nome dell'utente
     * @param cognome cognome dell'utente
     * @return testo dell'email
     */
    private String buildEmailBody(String code, String nome, String cognome) {
        return String.format(
            "Gentile %s %s,\n\n" +
            "Per completare la registrazione su GovCat, inserisci il seguente codice di verifica:\n\n" +
            "    %s\n\n" +
            "Il codice è valido per %d minuti.\n\n" +
            "Se non hai richiesto questa registrazione, ignora questa email.\n\n" +
            "Cordiali saluti,\n" +
            "Il team GovCat",
            nome, cognome, code, codeDurationMinutes
        );
    }

    /**
     * Verifica se il servizio email è disponibile.
     *
     * @return true se il mail sender è configurato
     */
    public boolean isMailServiceAvailable() {
        return mailSender != null;
    }
}
