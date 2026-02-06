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

    @Value("${email.verification.code.length:6}")
    private int codeLength;

    @Value("${email.verification.code.duration.minutes:5}")
    private int codeDurationMinutes;

    @Value("${email.verification.mail.from:noreply@govcat.it}")
    private String mailFrom;

    @Value("${firstlogin.verification.mail.subject:GovCat - Codice di verifica email}")
    private String firstloginMailSubject;

    @Value("${profilo.email.verification.mail.subject:GovCat - Conferma modifica email}")
    private String profiloMailSubject;

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
     * Invia email con il codice di verifica per la registrazione (primo login).
     *
     * @param toEmail indirizzo email destinatario
     * @param code codice di verifica
     * @param nome nome dell'utente
     * @param cognome cognome dell'utente
     * @throws IllegalStateException se il mail sender non è configurato
     */
    public void sendVerificationEmail(String toEmail, String code, String nome, String cognome) {
        sendEmail(toEmail, firstloginMailSubject, buildRegistrationEmailBody(code, nome, cognome));
    }

    /**
     * Invia email con il codice di verifica per la modifica email profilo.
     *
     * @param toEmail indirizzo email destinatario (nuova email da verificare)
     * @param code codice di verifica
     * @param nome nome dell'utente
     * @param cognome cognome dell'utente
     * @throws IllegalStateException se il mail sender non è configurato
     */
    public void sendEmailChangeVerification(String toEmail, String code, String nome, String cognome) {
        sendEmail(toEmail, profiloMailSubject, buildEmailChangeBody(code, nome, cognome));
    }

    /**
     * Metodo interno per l'invio email.
     */
    private void sendEmail(String toEmail, String subject, String body) {
        if (mailSender == null) {
            logger.error("JavaMailSender non configurato. Impossibile inviare email di verifica.");
            throw new IllegalStateException("Servizio email non configurato");
        }

        logger.info("Invio email di verifica a: {}", toEmail);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(mailFrom);
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(body);

        try {
            mailSender.send(message);
            logger.info("Email di verifica inviata con successo a: {}", toEmail);
        } catch (Exception e) {
            logger.error("Errore durante l'invio dell'email di verifica a {}: {}", toEmail, e.getMessage(), e);
            throw new RuntimeException("Errore durante l'invio dell'email di verifica", e);
        }
    }

    /**
     * Costruisce il corpo dell'email di verifica per la registrazione.
     */
    private String buildRegistrationEmailBody(String code, String nome, String cognome) {
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
     * Costruisce il corpo dell'email di verifica per la modifica email.
     */
    private String buildEmailChangeBody(String code, String nome, String cognome) {
        return String.format(
            "Gentile %s %s,\n\n" +
            "Per confermare la modifica del tuo indirizzo email su GovCat, inserisci il seguente codice di verifica:\n\n" +
            "    %s\n\n" +
            "Il codice è valido per %d minuti.\n\n" +
            "Se non hai richiesto questa modifica, ignora questa email e il tuo indirizzo email non sarà modificato.\n\n" +
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
