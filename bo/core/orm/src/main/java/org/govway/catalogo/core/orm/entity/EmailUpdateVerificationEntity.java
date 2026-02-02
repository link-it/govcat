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
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import lombok.Getter;
import lombok.Setter;

/**
 * Entity per tracciare le richieste di modifica email da parte di utenti già registrati.
 * Memorizza la nuova email proposta e il codice di verifica.
 */
@Getter
@Setter
@Entity
@Table(name = "email_update_verifications")
public class EmailUpdateVerificationEntity {

    public enum StatoVerifica {
        /** Richiesta di modifica in corso, in attesa di invio codice */
        PENDING,
        /** Codice di verifica inviato via email */
        CODE_SENT,
        /** Email verificata con successo, modifica applicata */
        VERIFIED,
        /** Verifica scaduta o annullata */
        EXPIRED
    }

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_email_update_verifications", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_email_update_verifications", sequenceName = "seq_email_update_verifications", allocationSize = 1)
    private Long id;

    /** Riferimento all'utente che richiede la modifica */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_utente", nullable = false)
    private UtenteEntity utente;

    /** Nuova email da verificare */
    @Column(name = "nuova_email", nullable = false, length = 255)
    private String nuovaEmail;

    /** Codice alfanumerico di verifica email */
    @Column(name = "codice_verifica", length = 10)
    private String codiceVerifica;

    /** Timestamp di scadenza del codice di verifica */
    @Column(name = "codice_verifica_scadenza")
    private Date codiceVerificaScadenza;

    /** Numero di tentativi di verifica codice per la sessione corrente */
    @Column(name = "tentativi_verifica")
    private Integer tentativiVerifica = 0;

    /** Numero totale di invii codice per questa richiesta */
    @Column(name = "tentativi_invio")
    private Integer tentativiInvio = 0;

    /** Stato corrente della verifica */
    @Column(name = "stato", nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private StatoVerifica stato;

    /** Timestamp di creazione del record */
    @Column(name = "data_creazione", nullable = false)
    private Date dataCreazione;

    /** Timestamp dell'ultimo tentativo di verifica o invio */
    @Column(name = "data_ultimo_tentativo")
    private Date dataUltimoTentativo;

}
