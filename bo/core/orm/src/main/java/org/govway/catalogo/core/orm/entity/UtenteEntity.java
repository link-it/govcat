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
package org.govway.catalogo.core.orm.entity;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Getter
@Setter
@Entity
@Table(name = "utenti")
public class UtenteEntity {
	
	public enum Stato {DISABILITATO, NON_CONFIGURATO, ABILITATO}
	public enum Ruolo {AMMINISTRATORE, COORDINATORE, REFERENTE_SERVIZIO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_utenti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_utenti", sequenceName = "seq_utenti", allocationSize = 1)
	private Long id;

    @Column(name = "id_utente", nullable=false, unique = true)
    private String idUtente;
    
    @Column(name = "principal", nullable=false, unique = true)
    private String principal;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
	private Stato stato;

    @Enumerated(EnumType.STRING)
	private Ruolo ruolo;
	
    @Column(name = "referente_tecnico", nullable=false)
	private boolean referenteTecnico;
	
	@ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_organizzazione", referencedColumnName = "id")
	private OrganizzazioneEntity organizzazione;
	
    @Column(nullable=false)
	private String nome;
    
    @Column(nullable=false)
	private String cognome;
	
    private String telefono;
	private String email;
	
    @Column(name = "telefono_aziendale")
	private String telefonoAziendale;
    @Column(name = "email_aziendale")
	private String emailAziendale;
	
	private String note;
	
    @Column(name = "tipi_notifiche_abilitate")
	private String tipiNotificheAbilitate;
	
    @Column(name = "tipi_entita_notifiche_abilitate")
	private String tipiEntitaNotificheAbilitate;
	
    @Column(name = "ruoli_notifiche_abilitate")
	private String ruoliNotificheAbilitate;

	@Lob
    @JdbcTypeCode(SqlTypes.LONGVARBINARY)
	private byte[] metadati;
	
	@ManyToMany(mappedBy = "utentiAssociati", fetch = FetchType.EAGER)
	@Cascade({CascadeType.MERGE, CascadeType.PERSIST})
	private Set<ClasseUtenteEntity> classi = new HashSet<>();
	
}
