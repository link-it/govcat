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
package org.govway.catalogo.core.orm.entity;

import java.util.Date;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Entity per tracciare i tentativi di registrazione utente al primo login.
 * Memorizza i dati estratti dal JWT e il codice di verifica email.
 */
@Getter
@Setter
@Entity
@Table(name = "registrazioni_utenti")
public class RegistrazioneUtenteEntity {

    public enum StatoRegistrazione {
        /** Registrazione iniziata, in attesa di conferma email */
        PENDING,
        /** Codice di verifica inviato via email */
        EMAIL_SENT,
        /** Email verificata con successo */
        VERIFIED,
        /** Registrazione completata, utente creato */
        COMPLETED,
        /** Registrazione scaduta o annullata */
        EXPIRED
    }

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_registrazioni_utenti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_registrazioni_utenti", sequenceName = "seq_registrazioni_utenti", allocationSize = 1)
    private Long id;

    /** Principal (codice fiscale) estratto dal JWT */
    @Column(name = "principal", nullable = false, length = 255)
    private String principal;

    /** Nome estratto dal JWT */
    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    /** Cognome estratto dal JWT */
    @Column(name = "cognome", nullable = false, length = 255)
    private String cognome;

    /** Email originale proveniente dal JWT */
    @Column(name = "email_jwt", length = 255)
    private String emailJwt;

    /** Email modificata dall'utente (se diversa da email_jwt) */
    @Column(name = "email_proposta", length = 255)
    private String emailProposta;

    /** Codice alfanumerico di verifica email */
    @Column(name = "codice_verifica", length = 10)
    private String codiceVerifica;

    /** Timestamp di scadenza del codice di verifica */
    @Column(name = "codice_verifica_scadenza")
    private Date codiceVerificaScadenza;

    /** Numero di tentativi di verifica codice per la sessione corrente */
    @Column(name = "tentativi_verifica")
    private Integer tentativiVerifica = 0;

    /** Numero totale di tentativi di registrazione */
    @Column(name = "tentativi_totali")
    private Integer tentativiTotali = 0;

    /** Stato corrente della registrazione */
    @Column(name = "stato", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private StatoRegistrazione stato;

    /** Timestamp di creazione del record */
    @Column(name = "data_creazione", nullable = false)
    private Date dataCreazione;

    /** Timestamp dell'ultimo tentativo di verifica */
    @Column(name = "data_ultimo_tentativo")
    private Date dataUltimoTentativo;

    /** Token ID (jti claim) del JWT per associare la registrazione alla sessione */
    @Column(name = "token_id", length = 255)
    private String tokenId;

}
