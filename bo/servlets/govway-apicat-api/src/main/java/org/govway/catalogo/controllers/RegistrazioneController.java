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
package org.govway.catalogo.controllers;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import org.govway.catalogo.ApiV1Controller;
import org.govway.catalogo.InfoProfilo;
import org.govway.catalogo.RequestUtils;
import org.govway.catalogo.assembler.ProfiloAssembler;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity;
import org.govway.catalogo.core.orm.entity.RegistrazioneUtenteEntity.StatoRegistrazione;
import org.govway.catalogo.core.orm.entity.UtenteEntity;
import org.govway.catalogo.core.orm.entity.UtenteEntity.Stato;
import org.govway.catalogo.core.services.RegistrazioneService;
import org.govway.catalogo.core.services.UtenteService;
import org.govway.catalogo.exception.BadRequestException;
import org.govway.catalogo.exception.ConflictException;
import org.govway.catalogo.exception.ErrorCode;
import org.govway.catalogo.exception.InternalException;
import org.govway.catalogo.exception.NotAuthorizedException;
import org.govway.catalogo.service.EmailVerificationService;
import org.govway.catalogo.servlets.api.RegistrazioneApi;
import org.govway.catalogo.servlets.model.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;

/**
 * Controller per la gestione della registrazione utente al primo login.
 * Attivo solo quando firstlogin_verifica_email_abilitata è true nella configurazione.
 */
@ApiV1Controller
public class RegistrazioneController implements RegistrazioneApi {

    private Logger logger = LoggerFactory.getLogger(RegistrazioneController.class);

    @Autowired
    private RegistrazioneService registrazioneService;

    @Autowired
    private UtenteService utenteService;

    @Autowired
    private EmailVerificationService emailVerificationService;

    @Autowired
    private RequestUtils requestUtils;

    @Autowired
    private ProfiloAssembler profiloAssembler;

    @Autowired
    private Configurazione configurazione;

    @Value("${firstlogin.verification.max.attempts:3}")
    private int maxVerificationAttempts;

    @Value("${firstlogin.verification.max.sends:5}")
    private int maxSendAttempts;

    private static final String MESSAGGIO_INFORMATIVO =
        "Per completare la registrazione su GovCat, conferma il tuo indirizzo email. " +
        "Puoi utilizzare l'email associata al tuo account o specificarne una diversa (es. email aziendale).";

    @Override
    public ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> getStatoRegistrazione() {
        try {
            this.logger.info("getStatoRegistrazione: Invocazione in corso...");

            // Verifica che la feature sia abilitata
            checkFeatureEnabled();

            // Ottiene le info dal JWT
            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;
            this.logger.debug("Principal dal JWT: {}", principal);

            // Verifica se l'utente è già registrato
            if (current.utente != null) {
                return ResponseEntity.ok(buildStatoRegistrazione(
                    StatoRegistrazioneEnum.GIA_REGISTRATO, null, current));
            }

            // Cerca o crea una registrazione in corso
            Idm idm = this.requestUtils.getIdm();
            Optional<RegistrazioneUtenteEntity> existingReg =
                this.registrazioneService.findByPrincipal(principal);

            if (existingReg.isPresent() && existingReg.get().getStato() == StatoRegistrazione.COMPLETED) {
                // Registrazione già completata ma utente non ancora in sessione
                return ResponseEntity.ok(buildStatoRegistrazione(
                    StatoRegistrazioneEnum.GIA_REGISTRATO, existingReg.get(), current));
            }

            // Crea nuova registrazione o recupera quella esistente
            RegistrazioneUtenteEntity reg = existingReg.orElseGet(() ->
                this.registrazioneService.createRegistrazione(
                    principal,
                    idm.getNome(),
                    idm.getCognome(),
                    idm.getEmail(),
                    getTokenId()
                )
            );

            StatoRegistrazioneEnum stato = mapStatoToEnum(reg.getStato());

            this.logger.info("getStatoRegistrazione: Invocazione completata con successo");
            return ResponseEntity.ok(buildStatoRegistrazione(stato, reg, current));

        } catch (RuntimeException e) {
            this.logger.error("getStatoRegistrazione terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("getStatoRegistrazione terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    @Override
    public ResponseEntity<RisultatoRegistrazione> confermaEmailJwt() {
        try {
            this.logger.info("confermaEmailJwt: Invocazione in corso...");

            checkFeatureEnabled();

            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;
            Idm idm = this.requestUtils.getIdm();

            // L'utente conferma l'email dal JWT senza verifica
            // Questo path è usato quando l'utente NON vuole modificare l'email

            return this.registrazioneService.runTransaction(() -> {
                // Completa direttamente la registrazione con l'email dal JWT
                String emailToUse = idm.getEmail();

                return completaRegistrazioneInternal(principal, emailToUse, idm);
            });

        } catch (RuntimeException e) {
            this.logger.error("confermaEmailJwt terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("confermaEmailJwt terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    @Override
    public ResponseEntity<org.govway.catalogo.servlets.model.StatoRegistrazione> modificaEmail(
            ModificaEmailRequest modificaEmailRequest) {
        try {
            this.logger.info("modificaEmail: Invocazione in corso...");

            checkFeatureEnabled();

            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;
            String nuovaEmail = modificaEmailRequest.getEmail();

            return this.registrazioneService.runTransaction(() -> {
                RegistrazioneUtenteEntity reg = getOrCreateRegistrazione(principal, current);

                // Aggiorna l'email proposta
                this.registrazioneService.updateEmailProposta(reg, nuovaEmail);

                this.logger.info("modificaEmail: Email aggiornata per principal {}", principal);
                return ResponseEntity.ok(buildStatoRegistrazione(
                    StatoRegistrazioneEnum.IN_ATTESA_CONFERMA, reg, current));
            });

        } catch (RuntimeException e) {
            this.logger.error("modificaEmail terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("modificaEmail terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    @Override
    public ResponseEntity<CodiceInviato> inviaCodiceVerifica() {
        try {
            this.logger.info("inviaCodiceVerifica: Invocazione in corso...");

            checkFeatureEnabled();

            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;

            return this.registrazioneService.runTransaction(() -> {
                RegistrazioneUtenteEntity reg = getOrCreateRegistrazione(principal, current);

                // Verifica numero massimo invii
                if (reg.getTentativiTotali() >= maxSendAttempts) {
                    throw new BadRequestException(ErrorCode.REG_429_MAX_SENDS);
                }

                // Genera e salva il codice
                String codice = this.emailVerificationService.generateVerificationCode();
                Date scadenza = this.emailVerificationService.calculateExpirationTime();

                this.registrazioneService.saveCodiceVerifica(reg, codice, scadenza);

                // Invia email
                String emailDest = reg.getEmailProposta() != null ?
                    reg.getEmailProposta() : reg.getEmailJwt();

                this.emailVerificationService.sendVerificationEmail(
                    emailDest, codice, reg.getNome(), reg.getCognome());

                // Incrementa tentativi totali
                reg.setTentativiTotali(reg.getTentativiTotali() + 1);
                this.registrazioneService.save(reg);

                CodiceInviato response = new CodiceInviato();
                response.setMessaggio("Codice di verifica inviato a " + emailDest);
                response.setScadenzaSecondi(this.emailVerificationService.getCodeDurationMinutes() * 60);

                this.logger.info("inviaCodiceVerifica: Codice inviato a {}", emailDest);
                return ResponseEntity.ok(response);
            });

        } catch (RuntimeException e) {
            this.logger.error("inviaCodiceVerifica terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("inviaCodiceVerifica terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    @Override
    public ResponseEntity<RisultatoVerifica> verificaCodice(VerificaCodiceRequest verificaCodiceRequest) {
        try {
            this.logger.info("verificaCodice: Invocazione in corso...");

            checkFeatureEnabled();

            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;
            String codiceInserito = verificaCodiceRequest.getCodice();

            return this.registrazioneService.runTransaction(() -> {
                RegistrazioneUtenteEntity reg = this.registrazioneService.findByPrincipal(principal)
                    .orElseThrow(() -> new BadRequestException(ErrorCode.REG_400_NO_REGISTRATION));

                // Verifica che sia stato inviato un codice
                if (reg.getCodiceVerifica() == null) {
                    throw new BadRequestException(ErrorCode.REG_400_NO_CODE);
                }

                // Verifica scadenza
                if (this.emailVerificationService.isCodeExpired(reg.getCodiceVerificaScadenza())) {
                    this.registrazioneService.markAsExpired(reg);
                    RisultatoVerifica response = new RisultatoVerifica();
                    response.setEsito(false);
                    response.setMessaggio("Codice scaduto. Richiedi un nuovo codice.");
                    response.setTentativiRimanenti(0);
                    return ResponseEntity.status(410).body(response);
                }

                // Incrementa tentativi
                this.registrazioneService.incrementTentativiVerifica(reg);

                int tentativiRimanenti = maxVerificationAttempts - reg.getTentativiVerifica();

                // Verifica codice
                boolean isValid = this.emailVerificationService.isCodeValid(
                    codiceInserito, reg.getCodiceVerifica(), reg.getCodiceVerificaScadenza());

                RisultatoVerifica response = new RisultatoVerifica();
                response.setEsito(isValid);
                response.setTentativiRimanenti(Math.max(0, tentativiRimanenti));

                if (isValid) {
                    this.registrazioneService.markAsVerified(reg);
                    response.setMessaggio("Email verificata con successo");
                    this.logger.info("verificaCodice: Email verificata per principal {}", principal);
                } else {
                    if (tentativiRimanenti <= 0) {
                        response.setMessaggio("Codice errato. Tentativi esauriti, richiedi un nuovo codice.");
                    } else {
                        response.setMessaggio("Codice errato. Tentativi rimanenti: " + tentativiRimanenti);
                    }
                    this.logger.warn("verificaCodice: Codice errato per principal {}", principal);
                }

                return ResponseEntity.ok(response);
            });

        } catch (RuntimeException e) {
            this.logger.error("verificaCodice terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("verificaCodice terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    @Override
    public ResponseEntity<RisultatoRegistrazione> completaRegistrazione() {
        try {
            this.logger.info("completaRegistrazione: Invocazione in corso...");

            checkFeatureEnabled();

            InfoProfilo current = this.requestUtils.getPrincipal(false);
            if (current == null) {
                throw new NotAuthorizedException(ErrorCode.AUT_403);
            }

            String principal = current.idUtente;
            Idm idm = this.requestUtils.getIdm();

            return this.registrazioneService.runTransaction(() -> {
                RegistrazioneUtenteEntity reg = this.registrazioneService.findByPrincipal(principal)
                    .orElseThrow(() -> new BadRequestException(ErrorCode.REG_400_NO_REGISTRATION));

                // Verifica che l'email sia stata verificata
                if (reg.getStato() != StatoRegistrazione.VERIFIED) {
                    throw new BadRequestException(ErrorCode.REG_400_NOT_VERIFIED);
                }

                String emailToUse = reg.getEmailProposta() != null ?
                    reg.getEmailProposta() : reg.getEmailJwt();

                return completaRegistrazioneInternal(principal, emailToUse, idm);
            });

        } catch (RuntimeException e) {
            this.logger.error("completaRegistrazione terminata con errore '4xx': " + e.getMessage(), e);
            throw e;
        } catch (Throwable e) {
            this.logger.error("completaRegistrazione terminata con errore: " + e.getMessage(), e);
            throw new InternalException(ErrorCode.SYS_500);
        }
    }

    // ========== Metodi privati ==========

    private void checkFeatureEnabled() {
        if (this.configurazione.getUtente() == null ||
            !Boolean.TRUE.equals(this.configurazione.getUtente().isFirstloginVerificaEmailAbilitata())) {
            throw new BadRequestException(ErrorCode.REG_400_NOT_ENABLED);
        }
    }

    private RegistrazioneUtenteEntity getOrCreateRegistrazione(String principal, InfoProfilo current) {
        Idm idm = this.requestUtils.getIdm();

        return this.registrazioneService.findByPrincipal(principal)
            .orElseGet(() -> this.registrazioneService.createRegistrazione(
                principal,
                idm.getNome(),
                idm.getCognome(),
                idm.getEmail(),
                getTokenId()
            ));
    }

    private ResponseEntity<RisultatoRegistrazione> completaRegistrazioneInternal(
            String principal, String emailToUse, Idm idm) {

        // Verifica se esiste già un utente con questa email aziendale
        Optional<UtenteEntity> existingByEmail =
            this.registrazioneService.findUtenteByEmailAziendale(emailToUse);

        RisultatoRegistrazione response = new RisultatoRegistrazione();
        UtenteEntity utente;

        if (existingByEmail.isPresent()) {
            // Caso: email già presente - aggiorna il principal
            utente = existingByEmail.get();

            // Verifica che il principal non sia già usato da un altro utente
            if (!utente.getPrincipal().equals(principal)) {
                Optional<UtenteEntity> existingByPrincipal =
                    this.utenteService.findByPrincipal(principal);
                if (existingByPrincipal.isPresent()) {
                    throw new ConflictException(ErrorCode.REG_409_PRINCIPAL_EXISTS);
                }

                this.registrazioneService.updatePrincipal(utente, principal);
                this.logger.info("Principal aggiornato per utente con email {}", emailToUse);
            }

            response.setEsito(EsitoRegistrazioneEnum.PRINCIPAL_AGGIORNATO);
            response.setMessaggio("Benvenuto! Il tuo account è stato associato all'utenza esistente.");
        } else {
            // Caso: nuovo utente - crea l'utente
            utente = new UtenteEntity();
            utente.setIdUtente(UUID.randomUUID().toString());
            utente.setPrincipal(principal);
            utente.setNome(idm.getNome());
            utente.setCognome(idm.getCognome());
            utente.setEmailAziendale(emailToUse);
            utente.setTelefonoAziendale(idm.getTelefono() != null ? idm.getTelefono() : "00-000000");
            utente.setReferenteTecnico(false);

            // Imposta lo stato in base alla configurazione
            if (Boolean.TRUE.equals(this.configurazione.getUtente().isAutoabilitazioneAbilitata())) {
                utente.setStato(Stato.ABILITATO);
            } else {
                utente.setStato(Stato.NON_CONFIGURATO);
            }

            this.utenteService.save(utente);
            this.logger.info("Nuovo utente creato con principal {}", principal);

            response.setEsito(EsitoRegistrazioneEnum.NUOVO_UTENTE);
            response.setMessaggio("Benvenuto in GovCat! La tua registrazione è stata completata con successo.");
        }

        // Marca la registrazione come completata
        this.registrazioneService.findByPrincipal(principal)
            .ifPresent(reg -> this.registrazioneService.markAsCompleted(reg));

        // Costruisce il profilo da restituire
        Profilo profilo = this.profiloAssembler.toModel(utente);
        response.setProfilo(profilo);

        this.logger.info("completaRegistrazione: Registrazione completata per principal {}", principal);
        return ResponseEntity.ok(response);
    }

    private org.govway.catalogo.servlets.model.StatoRegistrazione buildStatoRegistrazione(
            StatoRegistrazioneEnum stato, RegistrazioneUtenteEntity reg, InfoProfilo current) {

        org.govway.catalogo.servlets.model.StatoRegistrazione result =
            new org.govway.catalogo.servlets.model.StatoRegistrazione();
        result.setStato(stato);
        result.setMessaggioInformativo(MESSAGGIO_INFORMATIVO);

        if (reg != null) {
            result.setEmailJwt(reg.getEmailJwt());
            result.setEmailProposta(reg.getEmailProposta());
            result.setNome(reg.getNome());
            result.setCognome(reg.getCognome());
            result.setPrincipal(reg.getPrincipal());
            result.setTentativiRegistrazione(reg.getTentativiTotali());
        } else {
            Idm idm = this.requestUtils.getIdm();
            result.setEmailJwt(idm.getEmail());
            result.setEmailProposta(idm.getEmail());
            result.setNome(idm.getNome());
            result.setCognome(idm.getCognome());
            result.setPrincipal(current.idUtente);
            result.setTentativiRegistrazione(0);
        }

        return result;
    }

    private StatoRegistrazioneEnum mapStatoToEnum(StatoRegistrazione stato) {
        switch (stato) {
            case PENDING:
                return StatoRegistrazioneEnum.IN_ATTESA_CONFERMA;
            case EMAIL_SENT:
                return StatoRegistrazioneEnum.IN_ATTESA_VERIFICA;
            case VERIFIED:
                return StatoRegistrazioneEnum.EMAIL_VERIFICATA;
            case COMPLETED:
                return StatoRegistrazioneEnum.GIA_REGISTRATO;
            case EXPIRED:
                return StatoRegistrazioneEnum.IN_ATTESA_CONFERMA;
            default:
                return StatoRegistrazioneEnum.IN_ATTESA_CONFERMA;
        }
    }

    private String getTokenId() {
        // Tenta di estrarre il token ID dal JWT corrente
        // Se non disponibile, genera un UUID temporaneo
        try {
            InfoProfilo current = this.requestUtils.getPrincipal(false);
            return current != null ? current.idUtente + "_" + System.currentTimeMillis() :
                UUID.randomUUID().toString();
        } catch (Exception e) {
            return UUID.randomUUID().toString();
        }
    }
}
