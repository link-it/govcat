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

import java.util.Date;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.SequenceGenerator;
import javax.persistence.Table;

import org.hibernate.annotations.Cascade;
import org.hibernate.annotations.CascadeType;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "utenti")
public class UtenteEntity {
	
	public enum Stato {DISABILITATO, NON_CONFIGURATO, ABILITATO}
	public enum Ruolo {AMMINISTRATORE, REFERENTE_SERVIZIO}

    @Id
    @Column(name = "id")
    @GeneratedValue(generator = "seq_utenti", strategy = GenerationType.SEQUENCE)
    @SequenceGenerator(name = "seq_utenti", sequenceName = "seq_utenti", allocationSize = 1)
	private Long id;

    @Column(name = "id_utente", nullable=false, unique = true)
    private UUID idUtente;
    
    @Column(name = "principal", nullable=false, unique = true)
    private String principal;
    
    @Column(nullable=false)
    @Enumerated(EnumType.STRING)
	private Stato stato;

    @Enumerated(EnumType.STRING)
	private Ruolo ruolo;
	
    @Column(name = "referente_tecnico", nullable=false)
	private boolean referenteTecnico;
	
	@ManyToOne
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
    
    @Column(name = "data_creazione")
    private Date dataCreazione;
    
    @Column(name = "data_ultima_modifica")
    private Date dataUltimaModifica;
	
	private byte[] metadati;
	
	@ManyToMany(mappedBy = "utentiAssociati", fetch = FetchType.EAGER)
	@Cascade({CascadeType.MERGE, CascadeType.PERSIST})
	private Set<ClasseUtenteEntity> classi = new HashSet<>();
	
}
